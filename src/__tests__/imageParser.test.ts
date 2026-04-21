import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'

type OcrResult = {
  items: Array<{
    poly: Array<[number, number]>
    score?: number
    text: string
  }>
}

type SampleRegionConfig = {
  darkRatio: number
  highLuminance?: number
  lowLuminance?: number
}

type TestTextPolygonPoint = [number, number]
type TestTextPolygon = [
  TestTextPolygonPoint,
  TestTextPolygonPoint,
  TestTextPolygonPoint,
  TestTextPolygonPoint
]

type CanvasBehavior = 'success' | 'no-context' | 'empty-blob'
type ImageBehavior = 'load' | 'error'

const mockDispose = jest.fn(() => Promise.resolve())
const mockPredict = jest.fn((_image: HTMLImageElement) => {
  return Promise.resolve<Array<OcrResult>>([{ items: [] }])
})
const mockCreate = jest.fn(() =>
  Promise.resolve({
    dispose: mockDispose,
    predict: mockPredict
  })
)

jest.unstable_mockModule('@paddleocr/paddleocr-js', () => ({
  PaddleOCR: {
    create: mockCreate
  }
}))

let ImageParser: typeof import('../index').ImageParser
let inspectImage: typeof import('../index').inspectImage
let disposePaddleOcrRuntimeForTesting: typeof import('../index').__disposePaddleOcrRuntimeForTesting
let IntermediateDocumentApi: typeof import('@hamster-note/types').IntermediateDocument

const defaultImageWidth = 320
const defaultImageHeight = 180

let canvasBehavior: CanvasBehavior = 'success'
let canvasContextMock: {
  beginPath: ReturnType<typeof jest.fn>
  closePath: ReturnType<typeof jest.fn>
  clearRect: ReturnType<typeof jest.fn>
  drawImage: ReturnType<typeof jest.fn>
  direction: CanvasDirection
  fillRect: ReturnType<typeof jest.fn>
  fillStyle: string
  fillText: ReturnType<typeof jest.fn>
  font: string
  getImageData: ReturnType<typeof jest.fn>
  lineTo: ReturnType<typeof jest.fn>
  lineWidth: number
  measureText: ReturnType<typeof jest.fn>
  moveTo: ReturnType<typeof jest.fn>
  restore: ReturnType<typeof jest.fn>
  rotate: ReturnType<typeof jest.fn>
  save: ReturnType<typeof jest.fn>
  scale: ReturnType<typeof jest.fn>
  stroke: ReturnType<typeof jest.fn>
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
let measureTextWidthResolver: ((content: string) => number) | undefined
let originalDocument: Document | undefined
let originalImage: typeof Image | undefined
let originalCreateObjectURL: typeof URL.createObjectURL | undefined
let originalRevokeObjectURL: typeof URL.revokeObjectURL | undefined
let hadDocument = false
let hadImage = false
let hadCreateObjectURL = false
let hadRevokeObjectURL = false
let latestSampleRegionKey: string | undefined
let sampleRegionConfigMap: Map<string, SampleRegionConfig>

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

function createSampleRegionKey(
  x: number,
  y: number,
  width: number,
  height: number
): string {
  return [x, y, width, height].map((value) => value.toFixed(1)).join(':')
}

function createSampleImageData(
  width: number,
  height: number,
  config: SampleRegionConfig
): Uint8ClampedArray {
  const size = Math.max(1, width * height)
  const darkPixels = Math.round(size * config.darkRatio)
  const highLuminance = config.highLuminance ?? 240
  const lowLuminance = config.lowLuminance ?? 32
  const data = new Uint8ClampedArray(size * 4)

  for (let index = 0; index < size; index += 1) {
    const luminance = index < darkPixels ? lowLuminance : highLuminance
    const offset = index * 4
    data[offset] = luminance
    data[offset + 1] = luminance
    data[offset + 2] = luminance
    data[offset + 3] = 255
  }

  return data
}

function getMockMeasuredTextWidth(content: string): number {
  return Math.max(0, content.length * 10)
}

function createTextPolygon({
  x,
  y,
  width,
  height,
  rotate = 0
}: {
  height: number
  rotate?: number
  width: number
  x: number
  y: number
}): TestTextPolygon {
  const radians = (rotate * Math.PI) / 180
  const cosine = Math.cos(radians)
  const sine = Math.sin(radians)
  const topLeft: TestTextPolygonPoint = [x, y]
  const topRight: TestTextPolygonPoint = [x + width * cosine, y + width * sine]
  const bottomLeft: TestTextPolygonPoint = [
    x - height * sine,
    y + height * cosine
  ]

  return [
    topLeft,
    topRight,
    [
      topRight[0] + bottomLeft[0] - topLeft[0],
      topRight[1] + bottomLeft[1] - topLeft[1]
    ],
    bottomLeft
  ]
}

function getPolygonDistance(
  [startX, startY]: TestTextPolygonPoint,
  [endX, endY]: TestTextPolygonPoint
): number {
  return Math.hypot(endX - startX, endY - startY)
}

function normalizeAngle(value: number): number {
  let normalized = value

  while (normalized <= -180) normalized += 360
  while (normalized > 180) normalized -= 360

  return normalized
}

function getPolygonRotate(polygon: TestTextPolygon): number {
  const [topLeft, topRight] = polygon
  return normalizeAngle(
    (Math.atan2(topRight[1] - topLeft[1], topRight[0] - topLeft[0]) * 180) /
      Math.PI
  )
}

function getPolygonWidth(polygon: TestTextPolygon): number {
  const [topLeft, topRight, , bottomLeft] = polygon

  return (
    (getPolygonDistance(topLeft, topRight) +
      getPolygonDistance(bottomLeft, polygon[2])) /
    2
  )
}

function getPolygonHeight(polygon: TestTextPolygon): number {
  const [topLeft, topRight, bottomRight, bottomLeft] = polygon

  return (
    (getPolygonDistance(topLeft, bottomLeft) +
      getPolygonDistance(topRight, bottomRight)) /
    2
  )
}

function getNormalizedDirection(
  [startX, startY]: TestTextPolygonPoint,
  [endX, endY]: TestTextPolygonPoint
): TestTextPolygonPoint {
  const length = Math.hypot(endX - startX, endY - startY)
  if (!Number.isFinite(length) || length <= 0) return [0, 0]

  return [(endX - startX) / length, (endY - startY) / length]
}

function getPolygonAdvanceWidth(
  polygon: TestTextPolygon,
  isVertical = false
): number {
  return isVertical
    ? (getPolygonDistance(polygon[0], polygon[3]) +
        getPolygonDistance(polygon[1], polygon[2])) /
        2
    : (getPolygonDistance(polygon[0], polygon[1]) +
        getPolygonDistance(polygon[3], polygon[2])) /
        2
}

function getBaselineOrigin(
  polygon: TestTextPolygon,
  ascent: number,
  isVertical = false
): TestTextPolygonPoint {
  const [topLeft, topRight, , bottomLeft] = polygon
  const horizontalAxis = getNormalizedDirection(topLeft, topRight)
  const verticalAxis = getNormalizedDirection(topLeft, bottomLeft)
  const [offsetX, offsetY] = isVertical
    ? ([-horizontalAxis[0], -horizontalAxis[1]] as TestTextPolygonPoint)
    : verticalAxis

  return [topLeft[0] + offsetX * ascent, topLeft[1] + offsetY * ascent]
}

function setSampleRegionConfig(
  region: { height: number; width: number; x: number; y: number },
  config: SampleRegionConfig
): void {
  sampleRegionConfigMap.set(
    createSampleRegionKey(region.x, region.y, region.width, region.height),
    config
  )
}

function getSampleRegionConfig(
  regionKey: string | undefined
): SampleRegionConfig | undefined {
  if (!regionKey) return undefined

  const exactConfig = sampleRegionConfigMap.get(regionKey)
  if (exactConfig) return exactConfig

  const [x, y, width, height] = regionKey.split(':').map(Number)
  if ([x, y, width, height].some((value) => !Number.isFinite(value))) {
    return undefined
  }

  for (const [candidateKey, config] of sampleRegionConfigMap.entries()) {
    const [candidateX, candidateY, candidateWidth, candidateHeight] =
      candidateKey.split(':').map(Number)

    if (
      Math.abs(candidateX - x) <= 1 &&
      Math.abs(candidateY - y) <= 1 &&
      Math.abs(candidateWidth - width) <= 2 &&
      Math.abs(candidateHeight - height) <= 2
    ) {
      return config
    }
  }

  return undefined
}

beforeAll(async () => {
  const imageParserModule = await import('../index')
  const typesModule = await import('@hamster-note/types')

  ImageParser = imageParserModule.ImageParser
  inspectImage = imageParserModule.inspectImage
  disposePaddleOcrRuntimeForTesting =
    imageParserModule.__disposePaddleOcrRuntimeForTesting
  IntermediateDocumentApi = typesModule.IntermediateDocument
})

beforeEach(() => {
  canvasBehavior = 'success'
  imageBehavior = 'load'
  Reflect.deleteProperty(globalThis, '__IMAGE_PARSER_PADDLE_OCR__')

  mockCreate.mockReset()
  mockCreate.mockImplementation(async () => ({
    dispose: mockDispose,
    predict: mockPredict
  }))

  mockDispose.mockReset()
  mockDispose.mockResolvedValue(undefined)

  mockPredict.mockReset()
  mockPredict.mockImplementation(async () => [{ items: [] }])

  latestSampleRegionKey = undefined
  measureTextWidthResolver = undefined
  sampleRegionConfigMap = new Map()

  canvasContextMock = {
    beginPath: jest.fn(),
    closePath: jest.fn(),
    clearRect: jest.fn(),
    drawImage: jest.fn((...args: unknown[]) => {
      if (args.length !== 9) return

      const [, sx, sy, sw, sh] = args as [
        HTMLImageElement,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
      ]
      latestSampleRegionKey = createSampleRegionKey(sx, sy, sw, sh)
    }),
    direction: 'ltr',
    fillRect: jest.fn(),
    fillStyle: '',
    fillText: jest.fn(),
    font: '',
    getImageData: jest.fn(
      (_x: number, _y: number, width: number, height: number) => {
        const config = getSampleRegionConfig(latestSampleRegionKey) ?? {
          darkRatio: 0.08
        }

        return {
          data: createSampleImageData(width, height, config),
          height,
          width
        } as ImageData
      }
    ),
    lineTo: jest.fn(),
    lineWidth: 0,
    measureText: jest.fn((content: string) => {
      const width = measureTextWidthResolver
        ? measureTextWidthResolver(content)
        : getMockMeasuredTextWidth(content)

      return { width } as TextMetrics
    }),
    moveTo: jest.fn(),
    restore: jest.fn(),
    rotate: jest.fn(),
    save: jest.fn(),
    scale: jest.fn(),
    stroke: jest.fn(),
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

afterEach(async () => {
  await disposePaddleOcrRuntimeForTesting()
  Reflect.deleteProperty(globalThis, '__IMAGE_PARSER_PADDLE_OCR__')

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

    const inspection = await inspectImage(blob)

    expect(inspection.status).toBe('ocr-supported')
    expect(mockCreate).not.toHaveBeenCalled()
    expect(mockPredict).not.toHaveBeenCalled()
  })

  it('encode 成功时映射 OCR 结果', async () => {
    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [10, 20],
              [110, 20],
              [110, 44],
              [10, 44]
            ],
            score: 0.98,
            text: 'Hello OCR'
          }
        ]
      }
    ])

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
      fontWeight: number
      italic: boolean
      polygon: TestTextPolygon
      skew: number
    }

    expect(document.pageCount).toBe(1)
    expect(page.width).toBe(defaultImageWidth)
    expect(page.height).toBe(defaultImageHeight)
    expect(texts).toHaveLength(1)
    expect(text.content).toBe('Hello OCR')
    expect(text.polygon).toEqual([
      [10, 20],
      [110, 20],
      [110, 44],
      [10, 44]
    ])
    expect(text.fontWeight).toBe(400)
    expect(text.italic).toBe(false)
    expect(getPolygonRotate(text.polygon)).toBe(0)
    expect(text.skew).toBe(0)
  })

  it('encode 会把乱序 polygon 归一化为左上右上右下左下', async () => {
    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [110, 20],
              [110, 44],
              [10, 44],
              [10, 20]
            ],
            score: 0.98,
            text: 'Hello OCR'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const texts = await firstPage.getTexts()
    const text = texts[0] as unknown as {
      polygon: TestTextPolygon
    }

    expect(text.polygon).toEqual([
      [10, 20],
      [110, 20],
      [110, 44],
      [10, 44]
    ])
  })

  it('encode 会把右上倾斜的横排文本 polygon 归一化为左上右上右下左下', async () => {
    const slantedPolygon = createTextPolygon({
      x: 40,
      y: 60,
      width: 120,
      height: 28,
      rotate: -8
    })

    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              slantedPolygon[1],
              slantedPolygon[2],
              slantedPolygon[3],
              slantedPolygon[0]
            ],
            score: 0.98,
            text: 'slanted horizontal'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const texts = await firstPage.getTexts()
    const text = texts[0] as unknown as {
      polygon: TestTextPolygon
    }

    expect(text.polygon).toEqual(slantedPolygon)
  })

  it('encode 在近竖直旋转文本上仍可归一化 polygon 点序', async () => {
    const rotatedPolygon = createTextPolygon({
      x: 120,
      y: 40,
      width: 32,
      height: 96,
      rotate: 80
    })

    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              rotatedPolygon[2],
              rotatedPolygon[3],
              rotatedPolygon[0],
              rotatedPolygon[1]
            ],
            score: 0.97,
            text: 'near vertical'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const texts = await firstPage.getTexts()
    const text = texts[0] as unknown as {
      polygon: TestTextPolygon
    }

    expect(text.polygon).toEqual(rotatedPolygon)
  })

  it('encode 空识别结果时返回空文本页', async () => {
    mockPredict.mockResolvedValueOnce([{ items: [] }])

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

  it('encode 会过滤空文本并为非法 poly 提供安全回退', async () => {
    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10]
            ],
            score: 0.91,
            text: '   '
          },
          {
            poly: [[0, 0]],
            score: 0.87,
            text: 'invalid-poly'
          },
          {
            poly: [
              [5, 6],
              [105, 6],
              [105, 36],
              [5, 36]
            ],
            score: 0.99,
            text: 'valid text'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const texts = await firstPage.getTexts()
    const invalidPolyText = texts[0] as unknown as {
      content: string
      polygon: TestTextPolygon
    }
    const validText = texts[1] as unknown as {
      content: string
      polygon: TestTextPolygon
    }

    expect(texts).toHaveLength(2)
    expect(invalidPolyText.content).toBe('invalid-poly')
    expect(invalidPolyText.polygon).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1]
    ])
    expect(validText.content).toBe('valid text')
    expect(validText.polygon).toEqual([
      [5, 6],
      [105, 6],
      [105, 36],
      [5, 36]
    ])
  })

  it('encode 会对旋转、斜体与异常样式线索执行稳定映射', async () => {
    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [10, 20],
              [110, 46],
              [104, 70],
              [4, 44]
            ],
            score: 0.98,
            text: 'rotated'
          },
          {
            poly: [
              [130, 20],
              [230, 20],
              [220, 52],
              [120, 52]
            ],
            score: 0.95,
            text: 'italic'
          },
          {
            poly: [
              [20, 100],
              [120, 132]
            ],
            score: 0.9,
            text: 'fallback'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const texts = (await firstPage.getTexts()) as Array<{
      content: string
      fontWeight: number
      italic: boolean
      polygon: TestTextPolygon
      skew: number
    }>
    const rotatedText = texts.find((text) => text.content === 'rotated')
    const italicText = texts.find((text) => text.content === 'italic')
    const fallbackText = texts.find((text) => text.content === 'fallback')

    expect(rotatedText).toBeDefined()
    expect(
      getPolygonRotate(
        rotatedText?.polygon ??
          createTextPolygon({ x: 0, y: 0, width: 1, height: 1 })
      )
    ).toBeCloseTo(14.6, 1)
    expect(rotatedText?.italic).toBe(false)
    expect(Math.abs(rotatedText?.skew ?? 0)).toBeLessThan(1)

    expect(italicText).toBeDefined()
    expect(
      getPolygonRotate(
        italicText?.polygon ??
          createTextPolygon({ x: 0, y: 0, width: 1, height: 1 })
      )
    ).toBe(0)
    expect(italicText?.italic).toBe(true)
    expect(italicText?.skew).toBeCloseTo(17.4, 1)

    expect(fallbackText).toBeDefined()
    expect(fallbackText?.polygon).toEqual([
      [20, 100],
      [120, 100],
      [120, 132],
      [20, 132]
    ])
    expect(fallbackText?.fontWeight).toBe(400)
    expect(fallbackText?.italic).toBe(false)
    expect(
      getPolygonRotate(
        fallbackText?.polygon ??
          createTextPolygon({ x: 0, y: 0, width: 1, height: 1 })
      )
    ).toBe(0)
    expect(fallbackText?.skew).toBe(0)
  })

  it('encode 对旋转框、轻微梯形与非法 poly 输出稳定几何', async () => {
    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [10, 20],
              [110, 46],
              [104, 70],
              [4, 44]
            ],
            score: 0.98,
            text: 'rotated geometry'
          },
          {
            poly: [
              [140, 20],
              [242, 24],
              [236, 56],
              [136, 52]
            ],
            score: 0.95,
            text: 'trapezoid geometry'
          },
          {
            poly: [
              [200, 40],
              [260, 40],
              [260, 40],
              [200, 60]
            ],
            score: 0.88,
            text: 'fallback geometry'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const texts = (await firstPage.getTexts()) as Array<{
      content: string
      polygon: TestTextPolygon
    }>
    const rotatedText = texts.find(
      (text) => text.content === 'rotated geometry'
    )
    const trapezoidText = texts.find(
      (text) => text.content === 'trapezoid geometry'
    )
    const fallbackText = texts.find(
      (text) => text.content === 'fallback geometry'
    )

    expect(rotatedText).toBeDefined()
    expect(rotatedText?.polygon).toEqual([
      [10, 20],
      [110, 46],
      [104, 70],
      [4, 44]
    ])
    expect(
      getPolygonWidth(
        rotatedText?.polygon ??
          createTextPolygon({ x: 0, y: 0, width: 1, height: 1 })
      )
    ).toBeCloseTo(103.3, 1)
    expect(
      getPolygonHeight(
        rotatedText?.polygon ??
          createTextPolygon({ x: 0, y: 0, width: 1, height: 1 })
      )
    ).toBeCloseTo(24.7, 1)
    expect(
      getPolygonRotate(
        rotatedText?.polygon ??
          createTextPolygon({ x: 0, y: 0, width: 1, height: 1 })
      )
    ).toBeCloseTo(14.6, 1)

    expect(trapezoidText).toBeDefined()
    expect(trapezoidText?.polygon).toEqual([
      [140, 20],
      [242, 24],
      [236, 56],
      [136, 52]
    ])
    expect(
      getPolygonWidth(
        trapezoidText?.polygon ??
          createTextPolygon({ x: 0, y: 0, width: 1, height: 1 })
      )
    ).toBeCloseTo(101.1, 1)
    expect(
      getPolygonHeight(
        trapezoidText?.polygon ??
          createTextPolygon({ x: 0, y: 0, width: 1, height: 1 })
      )
    ).toBeCloseTo(32.4, 1)
    expect(
      getPolygonRotate(
        trapezoidText?.polygon ??
          createTextPolygon({ x: 0, y: 0, width: 1, height: 1 })
      )
    ).toBeCloseTo(2.2, 1)

    expect(fallbackText).toBeDefined()
    expect(fallbackText?.polygon).toEqual([
      [200, 40],
      [260, 40],
      [260, 60],
      [200, 60]
    ])
    expect(
      getPolygonWidth(
        fallbackText?.polygon ??
          createTextPolygon({ x: 0, y: 0, width: 1, height: 1 })
      )
    ).toBe(60)
    expect(
      getPolygonHeight(
        fallbackText?.polygon ??
          createTextPolygon({ x: 0, y: 0, width: 1, height: 1 })
      )
    ).toBe(20)
    expect(
      getPolygonRotate(
        fallbackText?.polygon ??
          createTextPolygon({ x: 0, y: 0, width: 1, height: 1 })
      )
    ).toBe(0)
  })

  it('OCR 推理失败时提示明确错误', async () => {
    mockPredict.mockRejectedValueOnce(new Error('runtime failed'))

    await expect(
      ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    ).rejects.toThrow('OCR 推理失败')
  })

  it('OCR 推理失败后会复位实例缓存并允许重新初始化', async () => {
    mockPredict
      .mockRejectedValueOnce(new Error('runtime failed'))
      .mockResolvedValueOnce([
        {
          items: [
            {
              poly: [
                [10, 20],
                [110, 20],
                [110, 44],
                [10, 44]
              ],
              score: 0.95,
              text: 'Recovered OCR'
            }
          ]
        }
      ])

    await expect(
      ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    ).rejects.toThrow('OCR 推理失败')

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))

    expect(document.pageCount).toBe(1)
    expect(mockCreate).toHaveBeenCalledTimes(2)
    expect(mockDispose).toHaveBeenCalledTimes(1)
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
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockPredict).toHaveBeenCalledTimes(3)
  })

  it('优先使用显式注入的 OCR 模块覆盖默认动态导入', async () => {
    const overridePredict = jest.fn(async () => [
      {
        items: [
          {
            poly: [
              [12, 18],
              [112, 18],
              [112, 42],
              [12, 42]
            ],
            score: 0.99,
            text: 'Injected OCR'
          }
        ]
      }
    ])
    const overrideDispose = jest.fn(async () => undefined)
    const overrideCreate = jest.fn(async () => ({
      dispose: overrideDispose,
      predict: overridePredict
    }))

    Reflect.set(globalThis, '__IMAGE_PARSER_PADDLE_OCR__', {
      PaddleOCR: {
        create: overrideCreate
      }
    })

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const texts = await firstPage.getTexts()
    const text = texts[0] as unknown as { content: string }

    expect(document.pageCount).toBe(1)
    expect(text.content).toBe('Injected OCR')
    expect(overrideCreate).toHaveBeenCalledTimes(1)
    expect(overridePredict).toHaveBeenCalledTimes(1)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('支持使用真实类导出形状的 PaddleOCR 工厂', async () => {
    const overridePredict = jest.fn(async () => [
      {
        items: [
          {
            poly: [
              [14, 16],
              [114, 16],
              [114, 40],
              [14, 40]
            ],
            score: 0.99,
            text: 'Class OCR'
          }
        ]
      }
    ])
    const overrideDispose = jest.fn(async () => undefined)

    class OverridePaddleOCR {
      static async create() {
        return {
          dispose: overrideDispose,
          predict: overridePredict
        }
      }
    }

    Reflect.set(globalThis, '__IMAGE_PARSER_PADDLE_OCR__', {
      PaddleOCR: OverridePaddleOCR
    })

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const texts = await firstPage.getTexts()
    const text = texts[0] as unknown as { content: string }

    expect(document.pageCount).toBe(1)
    expect(text.content).toBe('Class OCR')
    expect(overridePredict).toHaveBeenCalledTimes(1)
    expect(mockCreate).not.toHaveBeenCalled()
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
    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [10, 20],
              [110, 20],
              [110, 44],
              [10, 44]
            ],
            score: 0.98,
            text: 'Hello OCR'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0] as (typeof pages)[number] | undefined

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    expect(await firstPage.getThumbnail()).toBe(
      'data:image/png;base64,AQIDBA=='
    )

    canvasContextMock.drawImage.mockClear()
    canvasContextMock.scale.mockClear()
    canvasContextMock.translate.mockClear()
    canvasContextMock.fillRect.mockClear()
    canvasContextMock.fillText.mockClear()

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
    expect(canvasContextMock.scale).toHaveBeenCalledTimes(1)
    expect(canvasContextMock.scale.mock.calls[0]?.[0]).toBeCloseTo(
      100 / getMockMeasuredTextWidth('Hello OCR'),
      6
    )
    expect(canvasContextMock.scale.mock.calls[0]?.[1]).toBe(1)
    expect(canvasContextMock.fillText).toHaveBeenCalledWith('Hello OCR', 0, 0)
    expect(canvasContextMock.drawImage).not.toHaveBeenCalled()
  })

  it('显式释放 OCR 实例后下次 encode 会重新初始化', async () => {
    await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    await disposePaddleOcrRuntimeForTesting()
    await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))

    expect(mockCreate).toHaveBeenCalledTimes(2)
    expect(mockDispose).toHaveBeenCalledTimes(1)
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
    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [10, 20],
              [110, 20],
              [110, 44],
              [10, 44]
            ],
            score: 0.98,
            text: 'Hello OCR'
          }
        ]
      }
    ])

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
      italic: true,
      polygon: createTextPolygon({
        x: -20,
        y: defaultImageHeight - 5,
        width: 100,
        height: 40,
        rotate: 15
      }),
      skew: 10
    })

    firstPage.getTexts = async () => [clippedText]
    canvasContextMock.translate.mockClear()
    canvasContextMock.rotate.mockClear()
    canvasContextMock.scale.mockClear()
    canvasContextMock.transform.mockClear()
    canvasContextMock.fillText.mockClear()

    const decodedBuffer = await ImageParser.decode(document)

    expect(decodedBuffer.byteLength).toBeGreaterThan(0)
    expect(canvasContextMock.fillStyle).toBe('#123456')
    expect(canvasContextMock.font).toBe('italic 400 18px Mock Sans')
    const [expectedBaselineX, expectedBaselineY] = getBaselineOrigin(
      clippedText.polygon,
      clippedText.ascent
    )

    expect(canvasContextMock.translate.mock.calls[0]?.[0]).toBeCloseTo(
      expectedBaselineX,
      6
    )
    expect(canvasContextMock.translate.mock.calls[0]?.[1]).toBeCloseTo(
      expectedBaselineY,
      6
    )
    expect(canvasContextMock.rotate.mock.calls[0]?.[0]).toBeCloseTo(
      (15 * Math.PI) / 180,
      10
    )
    expect(canvasContextMock.transform).toHaveBeenCalledWith(
      1,
      0,
      Math.tan((10 * Math.PI) / 180),
      1,
      0,
      0
    )
    expect(canvasContextMock.scale).toHaveBeenCalledTimes(1)
    expect(canvasContextMock.scale.mock.calls[0]?.[0]).toBeCloseTo(
      getPolygonWidth(clippedText.polygon) /
        getMockMeasuredTextWidth(clippedText.content),
      6
    )
    expect(canvasContextMock.scale.mock.calls[0]?.[1]).toBe(1)
    expect(canvasContextMock.fillText).toHaveBeenCalledWith('Hello OCR', 0, 0)
  })

  it('decode 对缺失或异常样式值执行安全回退', async () => {
    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [8, 10],
              [108, 10],
              [108, 30],
              [8, 30]
            ],
            score: 0.94,
            text: 'safe fallback'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const originalText = (await firstPage.getTexts())[0]

    if (!originalText) {
      throw new Error('缺少 OCR 文本块')
    }

    const fallbackText = {
      ...originalText,
      color: '#654321',
      content: 'safe fallback',
      fontFamily: 'Mock Sans',
      fontSize: 20,
      fontWeight: Number.POSITIVE_INFINITY,
      italic: 'invalid' as unknown as boolean,
      skew: Number.NaN,
      polygon: createTextPolygon({ x: 8, y: 10, width: 100, height: 20 })
    }

    firstPage.getTexts = async () => [fallbackText]
    canvasContextMock.scale.mockClear()
    canvasContextMock.rotate.mockClear()
    canvasContextMock.transform.mockClear()
    canvasContextMock.fillText.mockClear()

    const decodedBuffer = await ImageParser.decode(document)

    expect(decodedBuffer.byteLength).toBeGreaterThan(0)
    expect(canvasContextMock.font).toBe('400 20px Mock Sans')
    expect(canvasContextMock.fillStyle).toBe('#654321')
    expect(canvasContextMock.rotate).not.toHaveBeenCalled()
    expect(canvasContextMock.transform).not.toHaveBeenCalled()
    expect(canvasContextMock.scale).toHaveBeenCalledWith(
      100 / getMockMeasuredTextWidth('safe fallback'),
      1
    )
    expect(canvasContextMock.fillText).toHaveBeenCalledWith(
      'safe fallback',
      0,
      0
    )
  })

  it('decode 让文本回放宽度对齐并在编辑后立即采用当前 width', async () => {
    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [10, 20],
              [110, 20],
              [110, 44],
              [10, 44]
            ],
            score: 0.98,
            text: 'Hello OCR'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const originalText = (await firstPage.getTexts())[0]

    if (!originalText) {
      throw new Error('缺少 OCR 文本块')
    }

    const updatedWidth = 180
    const updatedText = {
      ...originalText,
      polygon: createTextPolygon({
        x: 10,
        y: 20,
        width: updatedWidth,
        height: 24
      })
    }

    firstPage.getTexts = async () => [updatedText]
    canvasContextMock.scale.mockClear()
    canvasContextMock.fillText.mockClear()

    const decodedBuffer = await ImageParser.decode(document)

    expect(decodedBuffer.byteLength).toBeGreaterThan(0)
    expect(canvasContextMock.scale).toHaveBeenCalledTimes(1)
    expect(canvasContextMock.scale.mock.calls[0]?.[0]).toBeCloseTo(
      getPolygonWidth(updatedText.polygon) /
        getMockMeasuredTextWidth(updatedText.content),
      6
    )
    expect(canvasContextMock.scale.mock.calls[0]?.[1]).toBe(1)
    expect(canvasContextMock.fillText).toHaveBeenCalledWith('Hello OCR', 0, 0)
  })

  it('decode 对梯形 polygon 使用上下边平均宽度回放', async () => {
    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [10, 20],
              [110, 20],
              [110, 44],
              [10, 44]
            ],
            score: 0.98,
            text: 'Hello OCR'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const originalText = (await firstPage.getTexts())[0]

    if (!originalText) {
      throw new Error('缺少 OCR 文本块')
    }

    const trapezoidPolygon: TestTextPolygon = [
      [20, 30],
      [100, 30],
      [120, 60],
      [0, 60]
    ]

    firstPage.getTexts = async () => [
      {
        ...originalText,
        polygon: trapezoidPolygon
      }
    ]
    canvasContextMock.scale.mockClear()
    canvasContextMock.fillText.mockClear()

    const decodedBuffer = await ImageParser.decode(document)

    expect(decodedBuffer.byteLength).toBeGreaterThan(0)
    expect(canvasContextMock.scale).toHaveBeenCalledTimes(1)
    expect(canvasContextMock.scale.mock.calls[0]?.[0]).toBeCloseTo(
      getPolygonAdvanceWidth(trapezoidPolygon) /
        getMockMeasuredTextWidth(originalText.content),
      6
    )
    expect(canvasContextMock.scale.mock.calls[0]?.[1]).toBe(1)
    expect(canvasContextMock.fillText).toHaveBeenCalledWith('Hello OCR', 0, 0)
  })

  it('decode 可归一化非标准起点的 polygon 点序', async () => {
    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [10, 20],
              [110, 20],
              [110, 44],
              [10, 44]
            ],
            score: 0.98,
            text: 'Hello OCR'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const originalText = (await firstPage.getTexts())[0]

    if (!originalText) {
      throw new Error('缺少 OCR 文本块')
    }

    firstPage.getTexts = async () => [
      {
        ...originalText,
        polygon: [
          [110, 44],
          [10, 44],
          [10, 20],
          [110, 20]
        ] as TestTextPolygon
      }
    ]
    canvasContextMock.translate.mockClear()
    canvasContextMock.rotate.mockClear()
    canvasContextMock.scale.mockClear()

    const decodedBuffer = await ImageParser.decode(document)

    expect(decodedBuffer.byteLength).toBeGreaterThan(0)
    expect(canvasContextMock.translate).toHaveBeenCalledWith(10, 38)
    expect(canvasContextMock.rotate).not.toHaveBeenCalled()
    expect(canvasContextMock.scale.mock.calls[0]?.[0]).toBeCloseTo(
      100 / getMockMeasuredTextWidth('Hello OCR'),
      6
    )
  })

  it('decode 在近竖直旋转文本上仍可归一化 polygon 点序', async () => {
    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [10, 20],
              [110, 20],
              [110, 44],
              [10, 44]
            ],
            score: 0.98,
            text: 'Hello OCR'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const originalText = (await firstPage.getTexts())[0]

    if (!originalText) {
      throw new Error('缺少 OCR 文本块')
    }

    const rotatedPolygon = createTextPolygon({
      x: 60,
      y: 24,
      width: 28,
      height: 96,
      rotate: 80
    })

    firstPage.getTexts = async () => [
      {
        ...originalText,
        polygon: [
          rotatedPolygon[2],
          rotatedPolygon[3],
          rotatedPolygon[0],
          rotatedPolygon[1]
        ] as TestTextPolygon
      }
    ]
    canvasContextMock.translate.mockClear()
    canvasContextMock.rotate.mockClear()
    canvasContextMock.scale.mockClear()

    const decodedBuffer = await ImageParser.decode(document)

    expect(decodedBuffer.byteLength).toBeGreaterThan(0)
    const [expectedBaselineX, expectedBaselineY] = getBaselineOrigin(
      rotatedPolygon,
      originalText.ascent
    )

    expect(canvasContextMock.translate.mock.calls[0]?.[0]).toBeCloseTo(
      expectedBaselineX,
      6
    )
    expect(canvasContextMock.translate.mock.calls[0]?.[1]).toBeCloseTo(
      expectedBaselineY,
      6
    )
    expect(canvasContextMock.rotate.mock.calls[0]?.[0]).toBeCloseTo(
      (80 * Math.PI) / 180,
      10
    )
    expect(canvasContextMock.scale.mock.calls[0]?.[0]).toBeCloseTo(
      getPolygonAdvanceWidth(rotatedPolygon) /
        getMockMeasuredTextWidth(originalText.content),
      6
    )
  })

  it('decode 可消费 vertical/ttb 文本并沿纵向边回放', async () => {
    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [10, 20],
              [110, 20],
              [110, 44],
              [10, 44]
            ],
            score: 0.98,
            text: 'Hello OCR'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const originalText = (await firstPage.getTexts())[0]

    if (!originalText) {
      throw new Error('缺少 OCR 文本块')
    }

    const verticalPolygon = createTextPolygon({
      x: 30,
      y: 40,
      width: 20,
      height: 120
    })

    firstPage.getTexts = async () => [
      {
        ...originalText,
        dir: 'ttb' as (typeof originalText)['dir'],
        polygon: verticalPolygon,
        vertical: true
      }
    ]
    canvasContextMock.translate.mockClear()
    canvasContextMock.rotate.mockClear()
    canvasContextMock.scale.mockClear()

    const decodedBuffer = await ImageParser.decode(document)

    expect(decodedBuffer.byteLength).toBeGreaterThan(0)
    const [expectedBaselineX, expectedBaselineY] = getBaselineOrigin(
      verticalPolygon,
      originalText.ascent,
      true
    )
    expect(canvasContextMock.translate.mock.calls[0]?.[0]).toBeCloseTo(
      expectedBaselineX,
      6
    )
    expect(canvasContextMock.translate.mock.calls[0]?.[1]).toBeCloseTo(
      expectedBaselineY,
      6
    )
    expect(canvasContextMock.rotate.mock.calls[0]?.[0]).toBeCloseTo(
      Math.PI / 2,
      10
    )
    expect(canvasContextMock.scale.mock.calls[0]?.[0]).toBeCloseTo(
      120 / getMockMeasuredTextWidth('Hello OCR'),
      6
    )
  })

  it('decode 在空文本、空白文本、测量异常或非法目标宽度时回退稳定绘制', async () => {
    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [10, 20],
              [110, 20],
              [110, 44],
              [10, 44]
            ],
            score: 0.98,
            text: 'Hello OCR'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw new Error('缺少 OCR 页面')
    }

    const originalText = (await firstPage.getTexts())[0]

    if (!originalText) {
      throw new Error('缺少 OCR 文本块')
    }

    measureTextWidthResolver = (content: string) => {
      if (content === '测量异常') {
        throw new Error('measureText failed')
      }

      return getMockMeasuredTextWidth(content)
    }

    firstPage.getTexts = async () => [
      {
        ...originalText,
        content: '',
        polygon: createTextPolygon({ x: 10, y: 20, width: 120, height: 24 })
      },
      {
        ...originalText,
        content: '   ',
        polygon: createTextPolygon({ x: 10, y: 20, width: 130, height: 24 })
      },
      {
        ...originalText,
        content: '测量异常',
        polygon: createTextPolygon({ x: 10, y: 20, width: 140, height: 24 })
      },
      {
        ...originalText,
        content: '非法宽度',
        polygon: [
          [10, 20],
          [10, 20],
          [10, 20],
          [10, 20]
        ] as TestTextPolygon
      }
    ]

    canvasContextMock.scale.mockClear()
    canvasContextMock.fillText.mockClear()

    const decodedBuffer = await ImageParser.decode(document)

    expect(decodedBuffer.byteLength).toBeGreaterThan(0)
    expect(canvasContextMock.scale).not.toHaveBeenCalled()
    expect(canvasContextMock.fillText.mock.calls).toEqual([
      ['', 0, 0, 120],
      ['   ', 0, 0, 130],
      ['测量异常', 0, 0, 140],
      ['非法宽度', 0, 0, 1]
    ])
  })

  it('文档序列化后仍可保留样式字段并继续解码', async () => {
    setSampleRegionConfig(
      {
        x: 130,
        y: 24,
        width: 110,
        height: 32
      },
      { darkRatio: 0.15 }
    )

    mockPredict.mockResolvedValueOnce([
      {
        items: [
          {
            poly: [
              [140, 24],
              [240, 24],
              [230, 56],
              [130, 56]
            ],
            score: 0.96,
            text: 'serialized style'
          }
        ]
      }
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const serialized = await IntermediateDocumentApi.serialize(document)
    const serializedText = serialized.pages[0]?.texts[0]

    expect(serializedText?.fontWeight).toBe(600)
    expect(serializedText?.italic).toBe(true)
    expect(serializedText?.polygon).toEqual([
      [140, 24],
      [240, 24],
      [230, 56],
      [130, 56]
    ])
    expect(serializedText?.skew).toBeCloseTo(17.4, 1)
    expect(serializedText?.fontSize).toBeGreaterThan(0)

    const parsedDocument = IntermediateDocumentApi.parse(serialized)
    canvasContextMock.rotate.mockClear()
    canvasContextMock.transform.mockClear()

    const decodedBuffer = await ImageParser.decode(parsedDocument)

    expect(decodedBuffer.byteLength).toBeGreaterThan(0)
    expect(canvasContextMock.font).toBe(
      `italic 600 ${serializedText?.fontSize ?? 0}px sans-serif`
    )
    expect(canvasContextMock.transform).toHaveBeenCalledTimes(1)
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
