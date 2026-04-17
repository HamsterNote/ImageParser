import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'

import { ImageParser, type ImageParserInspection, inspectImage } from '../index'

type OcrResult = {
  points: unknown
  text: string[]
}

type CanvasBehavior = 'success' | 'no-context' | 'empty-blob'
type ImageBehavior = 'load' | 'error'

const mockInit = jest.fn(() => Promise.resolve())
const mockRecognize = jest.fn((_image: HTMLImageElement) => {
  return Promise.resolve<OcrResult>({ text: [], points: [] })
})

jest.mock('@paddlejs-models/ocr', () => ({
  detect: jest.fn(),
  init: mockInit,
  recognize: mockRecognize
}))

const defaultImageWidth = 320
const defaultImageHeight = 180

let canvasBehavior: CanvasBehavior = 'success'
let canvasContextMock: {
  clearRect: ReturnType<typeof jest.fn>
  drawImage: ReturnType<typeof jest.fn>
  direction: CanvasDirection
  fillRect: ReturnType<typeof jest.fn>
  fillStyle: string
  fillText: ReturnType<typeof jest.fn>
  font: string
  lineWidth: number
  restore: ReturnType<typeof jest.fn>
  rotate: ReturnType<typeof jest.fn>
  save: ReturnType<typeof jest.fn>
  strokeRect: ReturnType<typeof jest.fn>
  strokeStyle: string
  textBaseline: CanvasTextBaseline
  transform: ReturnType<typeof jest.fn>
  translate: ReturnType<typeof jest.fn>
}
let createElementMock: ReturnType<typeof jest.fn>
let imageBehavior: ImageBehavior = 'load'
let createObjectURLMock: ReturnType<typeof jest.fn>
let revokeObjectURLMock: ReturnType<typeof jest.fn>
let originalDocument: Document | undefined
let originalImage: typeof Image | undefined
let originalCreateObjectURL: typeof URL.createObjectURL | undefined
let originalRevokeObjectURL: typeof URL.revokeObjectURL | undefined
let hadDocument = false
let hadImage = false
let hadCreateObjectURL = false
let hadRevokeObjectURL = false

class MockImage {
  onerror: ((event: Event) => void) | null = null
  onload: ((event: Event) => void) | null = null
  naturalHeight = defaultImageHeight
  naturalWidth = defaultImageWidth
  height = defaultImageHeight
  width = defaultImageWidth
  private _src = ''

  set src(value: string) {
    this._src = value

    queueMicrotask(() => {
      if (imageBehavior === 'error') {
        this.onerror?.(new Event('error'))
        return
      }

      this.onload?.(new Event('load'))
    })
  }

  get src(): string {
    return this._src
  }
}

beforeEach(() => {
  canvasBehavior = 'success'
  imageBehavior = 'load'

  mockInit.mockReset()
  mockInit.mockResolvedValue(undefined)

  mockRecognize.mockReset()
  mockRecognize.mockImplementation(async () => ({ text: [], points: [] }))

  canvasContextMock = {
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    direction: 'ltr',
    fillRect: jest.fn(),
    fillStyle: '',
    fillText: jest.fn(),
    font: '',
    lineWidth: 0,
    restore: jest.fn(),
    rotate: jest.fn(),
    save: jest.fn(),
    strokeRect: jest.fn(),
    strokeStyle: '',
    textBaseline: 'alphabetic',
    transform: jest.fn(),
    translate: jest.fn()
  }

  createElementMock = jest.fn(() => ({
    getContext: jest.fn(() => {
      return canvasBehavior === 'no-context'
        ? null
        : (canvasContextMock as unknown as CanvasRenderingContext2D)
    }),
    height: 0,
    toBlob: jest.fn((callback: BlobCallback, type?: string) => {
      if (canvasBehavior === 'empty-blob') {
        callback(null)
        return
      }

      callback(
        new Blob([Uint8Array.from([9, 8, 7, 6])], {
          type: type || 'image/png'
        })
      )
    }),
    width: 0
  }))

  hadDocument = Reflect.has(globalThis, 'document')
  originalDocument = Reflect.get(globalThis, 'document') as Document | undefined
  Reflect.set(globalThis, 'document', {
    createElement: createElementMock
  })

  hadImage = Reflect.has(globalThis, 'Image')
  originalImage = Reflect.get(globalThis, 'Image') as typeof Image | undefined
  Reflect.set(globalThis, 'Image', MockImage as unknown as typeof Image)

  hadCreateObjectURL = Reflect.has(URL, 'createObjectURL')
  originalCreateObjectURL = Reflect.get(URL, 'createObjectURL') as
    | typeof URL.createObjectURL
    | undefined
  createObjectURLMock = jest.fn(() => 'blob:mock-url')
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: createObjectURLMock
  })

  hadRevokeObjectURL = Reflect.has(URL, 'revokeObjectURL')
  originalRevokeObjectURL = Reflect.get(URL, 'revokeObjectURL') as
    | typeof URL.revokeObjectURL
    | undefined
  revokeObjectURLMock = jest.fn()
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: revokeObjectURLMock
  })
})

afterEach(() => {
  if (hadDocument) {
    Reflect.set(globalThis, 'document', originalDocument)
  } else {
    Reflect.deleteProperty(globalThis, 'document')
  }

  if (hadImage) {
    Reflect.set(globalThis, 'Image', originalImage)
  } else {
    Reflect.deleteProperty(globalThis, 'Image')
  }

  if (hadCreateObjectURL) {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectURL
    })
  } else {
    Reflect.deleteProperty(URL, 'createObjectURL')
  }

  if (hadRevokeObjectURL) {
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectURL
    })
  } else {
    Reflect.deleteProperty(URL, 'revokeObjectURL')
  }
})

describe('ImageParser', () => {
  it('inspect 应返回 ocr-supported 摘要', async () => {
    const blob = new Blob([Uint8Array.from([137, 80, 78, 71])], {
      type: 'image/png'
    })

    const inspection: ImageParserInspection = await inspectImage(blob)

    expect(inspection.status).toBe('ocr-supported')
    expect(mockInit).not.toHaveBeenCalled()
    expect(mockRecognize).not.toHaveBeenCalled()
  })

  it('encode 成功时映射 OCR 结果', async () => {
    mockRecognize.mockResolvedValueOnce({
      points: [
        [
          [10, 20],
          [110, 20],
          [110, 44],
          [10, 44]
        ]
      ],
      text: ['Hello OCR']
    })

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const page = firstPage as unknown as { height: number; width: number }
    const texts = await firstPage.getTexts()
    const text = texts[0] as unknown as {
      content: string
      height: number
      width: number
      x: number
      y: number
    }

    expect(document.pageCount).toBe(1)
    expect(page.width).toBe(defaultImageWidth)
    expect(page.height).toBe(defaultImageHeight)
    expect(texts).toHaveLength(1)
    expect(text.content).toBe('Hello OCR')
    expect(text.x).toBe(10)
    expect(text.y).toBe(20)
    expect(text.width).toBe(100)
    expect(text.height).toBe(24)
  })

  it('encode 空识别结果时返回空文本页', async () => {
    mockRecognize.mockResolvedValueOnce({ points: [], text: [] })

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const texts = await firstPage.getTexts()

    expect(document.pageCount).toBe(1)
    expect(texts).toHaveLength(0)
  })

  it('OCR 推理失败时提示明确错误', async () => {
    mockRecognize.mockRejectedValueOnce(new Error('runtime failed'))

    await expect(
      ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    ).rejects.toThrow('OCR 推理失败')
  })

  it('图片解码失败时提示明确错误', async () => {
    imageBehavior = 'error'

    await expect(
      ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    ).rejects.toThrow('图片解码失败')
  })

  it('Blob、ArrayBuffer、ArrayBufferView 输入行为一致', async () => {
    const bytes = Uint8Array.from([1, 2, 3, 4])
    const blob = new Blob([bytes], { type: 'image/png' })
    const arrayBuffer = bytes.buffer.slice(0)
    const arrayBufferView = Uint8Array.from(bytes)

    const [blobDocument, arrayBufferDocument, arrayBufferViewDocument] =
      await Promise.all([
        ImageParser.encode(blob),
        ImageParser.encode(arrayBuffer),
        ImageParser.encode(arrayBufferView)
      ])

    expect(blobDocument.pageCount).toBe(1)
    expect(arrayBufferDocument.pageCount).toBe(1)
    expect(arrayBufferViewDocument.pageCount).toBe(1)
    expect(mockRecognize).toHaveBeenCalledTimes(3)
  })

  it('ArrayBuffer 输入会根据图片签名设置可解码 MIME', async () => {
    const jpegBytes = Uint8Array.from([255, 216, 255, 224, 0, 16])
    const arrayBuffer = jpegBytes.buffer.slice(
      jpegBytes.byteOffset,
      jpegBytes.byteOffset + jpegBytes.byteLength
    ) as ArrayBuffer

    const inspection = await ImageParser.inspect(arrayBuffer)
    await ImageParser.encode(arrayBuffer)
    const blob = createObjectURLMock.mock.calls[0]?.[0] as Blob | undefined

    expect(inspection.mimeType).toBe('image/jpeg')
    expect(blob?.type).toBe('image/jpeg')
  })

  it('ArrayBufferView 输入识别 MIME 时保留 byteOffset 和 byteLength', async () => {
    const backingBytes = Uint8Array.from([0, 0, 255, 216, 255, 224, 0, 16, 0])
    const view = new Uint8Array(backingBytes.buffer, 2, 6)

    const inspection = await ImageParser.inspect(view)
    await ImageParser.encode(view)
    const blob = createObjectURLMock.mock.calls[0]?.[0] as Blob | undefined

    expect(inspection.mimeType).toBe('image/jpeg')
    expect(blob?.type).toBe('image/jpeg')
  })

  it('encode 保存原图并支持 decode 按中间文档重建图片', async () => {
    mockRecognize.mockResolvedValueOnce({
      points: [
        [
          [10, 20],
          [110, 20],
          [110, 44],
          [10, 44]
        ]
      ],
      text: ['Hello OCR']
    })

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0] as (typeof pages)[number] | undefined

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    expect(await firstPage.getThumbnail()).toBe(
      'data:image/png;base64,AQIDBA=='
    )

    const decodedBuffer = await ImageParser.decode(document)

    expect(decodedBuffer.byteLength).toBeGreaterThan(0)
    expect(createElementMock).toHaveBeenCalledWith('canvas')
    expect(canvasContextMock.fillRect).toHaveBeenCalledWith(
      0,
      0,
      defaultImageWidth,
      defaultImageHeight
    )
    expect(canvasContextMock.translate).toHaveBeenCalledWith(10, 38)
    expect(canvasContextMock.fillText).toHaveBeenCalledWith(
      'Hello OCR',
      0,
      0,
      100
    )
    expect(canvasContextMock.drawImage).not.toHaveBeenCalled()
  })

  it('decode 缺少 thumbnail 时回退为默认图片类型并继续导出', async () => {
    const document = await ImageParser.encode(Uint8Array.from([9, 9, 9]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    firstPage.getThumbnail = async () => undefined

    const decodedBuffer = await ImageParser.decode(document)

    expect(decodedBuffer.byteLength).toBeGreaterThan(0)
  })

  it('decode 无法获取二维画布上下文时提示明确错误', async () => {
    canvasBehavior = 'no-context'

    const document = await ImageParser.encode(Uint8Array.from([9, 9, 9]))

    await expect(ImageParser.decode(document)).rejects.toThrow('画布初始化失败')
  })

  it('decode 图片导出失败时提示明确错误', async () => {
    canvasBehavior = 'empty-blob'

    const document = await ImageParser.encode(Uint8Array.from([9, 9, 9]))

    await expect(ImageParser.decode(document)).rejects.toThrow('图片导出失败')
  })

  it('decode 使用文本样式与定位在页面上绘制内容', async () => {
    mockRecognize.mockResolvedValueOnce({
      points: [
        [
          [10, 20],
          [110, 20],
          [110, 44],
          [10, 44]
        ]
      ],
      text: ['Hello OCR']
    })

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const originalTexts = await firstPage.getTexts()
    const firstText = originalTexts[0]

    if (!firstText) {
      throw new Error('缺少 OCR 文本块')
    }

    const clippedText = Object.assign(firstText, {
      color: '#123456',
      fontFamily: 'Mock Sans',
      fontSize: 18,
      height: 40,
      italic: true,
      rotate: 15,
      skew: 10,
      x: -20,
      y: defaultImageHeight - 5
    })

    firstPage.getTexts = async () => [clippedText]

    const decodedBuffer = await ImageParser.decode(document)

    expect(decodedBuffer.byteLength).toBeGreaterThan(0)
    expect(canvasContextMock.fillStyle).toBe('#123456')
    expect(canvasContextMock.font).toBe('italic 400 18px Mock Sans')
    expect(canvasContextMock.translate).toHaveBeenCalledWith(
      -20,
      defaultImageHeight + 13
    )
    expect(canvasContextMock.rotate).toHaveBeenCalledWith((15 * Math.PI) / 180)
    expect(canvasContextMock.transform).toHaveBeenCalledWith(
      1,
      0,
      Math.tan((10 * Math.PI) / 180),
      1,
      0,
      0
    )
  })

  it('global Blob 不可用时仍可识别 array-buffer-view', async () => {
    const originalBlob = globalThis.Blob

    Reflect.deleteProperty(globalThis, 'Blob')

    try {
      const inspection = await ImageParser.inspect(Uint8Array.from([1, 2, 3]))

      expect(inspection.kind).toBe('array-buffer-view')
      expect(inspection.status).toBe('ocr-supported')
    } finally {
      if (originalBlob === undefined) {
        Reflect.deleteProperty(globalThis, 'Blob')
      } else {
        globalThis.Blob = originalBlob
      }
    }
  })
})
