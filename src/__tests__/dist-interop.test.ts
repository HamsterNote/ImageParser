import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'

const mockDispose = jest.fn(() => Promise.resolve())
const mockPredict = jest.fn((_image: HTMLImageElement) => {
  return Promise.resolve([
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

const distEntry = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../dist/index.js'
)

const describeIfBuilt = existsSync(distEntry) ? describe : describe.skip

const defaultImageWidth = 320
const defaultImageHeight = 180

let imageBehavior: 'load' | 'error' = 'load'
let originalImage: typeof Image | undefined
let originalCreateObjectURL: typeof URL.createObjectURL | undefined
let originalRevokeObjectURL: typeof URL.revokeObjectURL | undefined
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
  imageBehavior = 'load'

  hadImage = Reflect.has(globalThis, 'Image')
  originalImage = Reflect.get(globalThis, 'Image') as typeof Image | undefined
  Reflect.set(globalThis, 'Image', MockImage as unknown as typeof Image)

  hadCreateObjectURL = Reflect.has(URL, 'createObjectURL')
  originalCreateObjectURL = Reflect.get(URL, 'createObjectURL') as
    | typeof URL.createObjectURL
    | undefined
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: jest.fn(() => 'blob:mock-url')
  })

  hadRevokeObjectURL = Reflect.has(URL, 'revokeObjectURL')
  originalRevokeObjectURL = Reflect.get(URL, 'revokeObjectURL') as
    | typeof URL.revokeObjectURL
    | undefined
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: jest.fn()
  })

  mockCreate.mockReset()
  mockCreate.mockImplementation(async () => ({
    dispose: mockDispose,
    predict: mockPredict
  }))
  mockDispose.mockReset()
  mockDispose.mockResolvedValue(undefined)
  mockPredict.mockReset()
  mockPredict.mockImplementation(async () => [{ items: [] }])
})

afterEach(() => {
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

describeIfBuilt('dist 产物互操作', () => {
  it('encode 返回的文档与外部类型保持一致', async () => {
    const [{ ImageParser }, { IntermediateDocument }] = await Promise.all([
      import(pathToFileURL(distEntry).href),
      import('@hamster-note/types')
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))

    expect(document).toBeInstanceOf(IntermediateDocument)
    expect(document.pageCount).toBe(1)
  })
})
