import { DocumentParser, type ParserInput } from '@hamster-note/document-parser'
import {
  IntermediateDocument,
  IntermediatePage,
  IntermediatePageMap,
  IntermediateText,
  TextDir
} from '@hamster-note/types'
import type { IntermediateTextPolygon } from '@hamster-note/types'
import type {
  OcrResultItem,
  PaddleOCR,
  PaddleOCRCreateOptions
} from '@paddleocr/paddleocr-js'

export type ImageParserInputKind = 'array-buffer' | 'array-buffer-view' | 'blob'

export interface ImageParserInspection {
  byteLength: number
  kind: ImageParserInputKind
  message: string
  mimeType?: string
  status: 'ocr-supported'
  supportedExtensions: readonly string[]
}

interface DecodedImage {
  image: HTMLImageElement
  mimeType: string
  width: number
  height: number
}

interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

interface OcrTextGeometry {
  x: number
  y: number
  width: number
  height: number
  rotate: number
  sampleBox: BoundingBox
}

type OcrPoint = readonly [number, number]

interface RenderCanvas {
  getContext(contextId: '2d'): CanvasRenderingContext2D | null
  height: number
  toBlob?: (callback: BlobCallback, type?: string, quality?: number) => void
  width: number
}

interface NormalizedOcrTextBlock {
  content: string
  fontWeight: number
  geometry: OcrTextGeometry
  italic: boolean
  polygon?: OrderedOcrPolygon
  skew: number
}

interface StandardizedIntermediateText {
  ascent: number
  baselineOrigin: OcrPoint
  color: string
  content: string
  direction: CanvasDirection
  fontFamily: string
  fontSize: number
  fontWeight: number
  italic: boolean
  rotation: number
  skew: number
  targetWidth?: number
}

interface OcrStyleHints {
  italic: boolean
  skew: number
}

interface OrderedOcrPolygon {
  bottomLeft: OcrPoint
  bottomRight: OcrPoint
  topLeft: OcrPoint
  topRight: OcrPoint
}

interface PixelSampleStats {
  contrast: number
  darkPixelRatio: number
  opaquePixelCount: number
}

type PaddleOcrModule = typeof import('@paddleocr/paddleocr-js')
type PaddleOcrInstance = Pick<PaddleOCR, 'dispose' | 'predict'>

declare global {
  interface Window {
    __IMAGE_PARSER_PADDLE_OCR__?: unknown
  }

  var __IMAGE_PARSER_PADDLE_OCR__: unknown
}

interface PaddleOcrFactory {
  create(options?: PaddleOCRCreateOptions): Promise<PaddleOcrInstance>
}

const DEFAULT_IMAGE_MIME_TYPE = 'image/png'
const DEFAULT_FONT_FAMILY = 'sans-serif'
const DEFAULT_TEXT_FONT_WEIGHT = 400
const DEFAULT_TEXT_ITALIC = false
const DEFAULT_TEXT_ROTATE = 0
const DEFAULT_TEXT_SKEW = 0
const DEFAULT_PADDLE_OCR_OPTIONS = {
  worker: false,
  unsupportedBehavior: 'error',
  lang: 'ch',
  ocrVersion: 'PP-OCRv5',
  text_det_unclip_ratio: 1,
  half_to_full: false,
  halfToFull: false,
  useAngleCls: true,
  convertFullWidth: false,
  ortOptions: {
    backend: 'wasm',
    disableWasmProxy: true,
    numThreads: 1,
    proxy: false,
    simd: false
  }
} satisfies PaddleOCRCreateOptions
const PNG_SIGNATURE = [137, 80, 78, 71] as const
const JPEG_SIGNATURE = [255, 216, 255] as const
const MAX_TEXT_ROTATE = 180
const MAX_TEXT_SKEW = 45
const MIN_GEOMETRY_EDGE_LENGTH = 2
const MAX_PARALLEL_ANGLE_DELTA = 12
const MAX_SIDE_ANGLE_DELTA = 12
const MAX_SKEW_SIDE_DELTA = 8
const ITALIC_SKEW_THRESHOLD = 8
const MAX_ITALIC_SKEW = 24
const MIN_PIXEL_SAMPLE_CONTRAST = 24
const MIN_PIXEL_SAMPLE_SIZE = 16
const MAX_PIXEL_SAMPLE_SIZE = 96
const FONT_WEIGHT_BUCKETS = [400, 500, 600, 700] as const

let paddleOcrInstancePromise: Promise<PaddleOcrInstance> | undefined

function getGlobalPaddleOcrOverride(): unknown {
  if (typeof globalThis !== 'object' || globalThis === null) return undefined

  return Reflect.get(globalThis, '__IMAGE_PARSER_PADDLE_OCR__')
}

function isBlobInput(input: ParserInput): input is Blob {
  return typeof Blob !== 'undefined' && input instanceof Blob
}

function detectInputKind(input: ParserInput): ImageParserInputKind {
  if (isBlobInput(input)) return 'blob'
  if (ArrayBuffer.isView(input)) return 'array-buffer-view'
  return 'array-buffer'
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return String(error)
}

function createParserError(message: string, error?: unknown): Error {
  if (error === undefined) return new Error(message)
  return new Error(`${message}：${getErrorMessage(error)}`)
}

function createBlobPart(bytes: Uint8Array): BlobPart {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

function hasSignature(
  bytes: Uint8Array,
  signature: readonly number[],
  offset = 0
): boolean {
  return signature.every((value, index) => bytes[offset + index] === value)
}

function startsWithAscii(
  bytes: Uint8Array,
  value: string,
  offset = 0
): boolean {
  return [...value].every(
    (character, index) => bytes[offset + index] === character.charCodeAt(0)
  )
}

function detectSvgMimeType(bytes: Uint8Array): string | undefined {
  const prefix = String.fromCharCode(...bytes.slice(0, 256)).trimStart()
  return prefix.startsWith('<svg') ||
    (prefix.startsWith('<?xml') && prefix.includes('<svg'))
    ? 'image/svg+xml'
    : undefined
}

function detectImageMimeType(bytes: Uint8Array): string | undefined {
  if (hasSignature(bytes, PNG_SIGNATURE)) return 'image/png'
  if (hasSignature(bytes, JPEG_SIGNATURE)) return 'image/jpeg'
  if (startsWithAscii(bytes, 'GIF87a') || startsWithAscii(bytes, 'GIF89a')) {
    return 'image/gif'
  }
  if (startsWithAscii(bytes, 'RIFF') && startsWithAscii(bytes, 'WEBP', 8)) {
    return 'image/webp'
  }
  if (startsWithAscii(bytes, 'BM')) return 'image/bmp'
  return detectSvgMimeType(bytes)
}

function normalizeDimension(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback
  return Math.max(1, Math.round(value))
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

function parseDataUrlMimeType(value: string): string | undefined {
  const matched = /^data:([^;,]+)(?:;[^,]*)?,/i.exec(value)
  return matched?.[1]
}

function resolveImageMimeType(value: string | undefined): string {
  if (!value || !value.startsWith('image/')) return DEFAULT_IMAGE_MIME_TYPE
  return value
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }

  if (typeof btoa === 'function') {
    let binary = ''
    const chunkSize = 0x8000

    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      const chunk = bytes.subarray(offset, offset + chunkSize)
      binary += String.fromCharCode(...chunk)
    }

    return btoa(binary)
  }

  throw createParserError(
    'ImageParser 图片编码失败：当前环境不支持 Base64 编码'
  )
}

async function createImageDataUrl(blob: Blob): Promise<string> {
  try {
    const bytes = new Uint8Array(await blob.arrayBuffer())
    const mimeType =
      blob.type || detectImageMimeType(bytes) || DEFAULT_IMAGE_MIME_TYPE
    return `data:${mimeType};base64,${bytesToBase64(bytes)}`
  } catch (error) {
    throw createParserError(
      'ImageParser 图片编码失败：无法生成原图 data URL',
      error
    )
  }
}

function toBinaryBytes(input: ParserInput): Uint8Array {
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
  }

  return new Uint8Array(input as ArrayBuffer)
}

async function toImageBlob(input: ParserInput): Promise<Blob> {
  if (isBlobInput(input)) return input

  if (typeof Blob === 'undefined') {
    throw createParserError('ImageParser 图片解码失败：当前环境不支持 Blob API')
  }

  const bytes = toBinaryBytes(input)
  return new Blob([createBlobPart(bytes)], {
    type: detectImageMimeType(bytes) ?? DEFAULT_IMAGE_MIME_TYPE
  })
}

function isPaddleOcrFactory(value: unknown): value is PaddleOcrFactory {
  if (
    (typeof value !== 'object' && typeof value !== 'function') ||
    value === null
  ) {
    return false
  }

  const candidate = value as {
    create?: unknown
  }

  return typeof candidate.create === 'function'
}

function resolvePaddleOcrFactory(value: unknown): PaddleOcrFactory {
  if (isPaddleOcrFactory(value)) return value

  if (typeof value === 'object' && value !== null && 'PaddleOCR' in value) {
    const candidate = value as { PaddleOCR?: unknown }
    if (isPaddleOcrFactory(candidate.PaddleOCR)) return candidate.PaddleOCR
  }

  if (typeof value === 'object' && value !== null && 'default' in value) {
    const candidate = value as { default?: unknown }
    if (isPaddleOcrFactory(candidate.default)) return candidate.default

    if (
      typeof candidate.default === 'object' &&
      candidate.default !== null &&
      'PaddleOCR' in candidate.default
    ) {
      const nestedCandidate = candidate.default as { PaddleOCR?: unknown }
      if (isPaddleOcrFactory(nestedCandidate.PaddleOCR)) {
        return nestedCandidate.PaddleOCR
      }
    }
  }

  throw createParserError('ImageParser OCR 模型加载失败：OCR 模块接口不可用')
}

function isPaddleOcrInstance(value: unknown): value is PaddleOcrInstance {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as {
    dispose?: unknown
    predict?: unknown
  }

  return (
    typeof candidate.dispose === 'function' &&
    typeof candidate.predict === 'function'
  )
}

async function clearPaddleOcrInstance(options?: {
  dispose?: boolean
}): Promise<void> {
  const dispose = options?.dispose ?? true
  const currentInstancePromise = paddleOcrInstancePromise
  paddleOcrInstancePromise = undefined

  if (!dispose || !currentInstancePromise) return

  try {
    const instance = await currentInstancePromise
    await instance.dispose()
  } catch {
    // ignore disposal errors when resetting cached runtime
  }
}

async function loadPaddleOcrRuntime(): Promise<PaddleOcrInstance> {
  if (!paddleOcrInstancePromise) {
    paddleOcrInstancePromise = Promise.resolve(getGlobalPaddleOcrOverride())
      .then(async (globalOverride) => {
        if (globalOverride !== undefined) return globalOverride

        return await import('@paddleocr/paddleocr-js')
      })
      .then(async (ocrModule: PaddleOcrModule | unknown) => {
        const runtime = await resolvePaddleOcrFactory(ocrModule).create(
          DEFAULT_PADDLE_OCR_OPTIONS
        )

        if (!isPaddleOcrInstance(runtime)) {
          throw createParserError(
            'ImageParser OCR 模型加载失败：OCR 实例接口不可用'
          )
        }

        return runtime
      })
      .catch((error: unknown) => {
        paddleOcrInstancePromise = undefined
        throw createParserError('ImageParser OCR 模型加载失败', error)
      })
  }

  return paddleOcrInstancePromise
}

export async function __disposePaddleOcrRuntimeForTesting(): Promise<void> {
  await clearPaddleOcrInstance()
}

function getImageDimensions(image: HTMLImageElement): {
  width: number
  height: number
} {
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  return { width, height }
}

async function decodeImageBlob(blob: Blob): Promise<DecodedImage> {
  if (typeof Image === 'undefined') {
    throw createParserError(
      'ImageParser 图片解码失败：当前环境不支持浏览器 Image API'
    )
  }

  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw createParserError(
      'ImageParser 图片解码失败：当前环境不支持 URL.createObjectURL'
    )
  }

  let objectUrl: string

  try {
    objectUrl = URL.createObjectURL(blob)
  } catch (error) {
    throw createParserError('ImageParser 图片解码失败：无法创建图片 URL', error)
  }

  return new Promise<DecodedImage>((resolve, reject) => {
    const image = new Image()
    const cleanup = (): void => {
      image.onload = null
      image.onerror = null
      URL.revokeObjectURL(objectUrl)
    }

    image.onload = () => {
      const { width, height } = getImageDimensions(image)
      cleanup()

      if (width <= 0 || height <= 0) {
        reject(createParserError('ImageParser 图片解码失败：图片尺寸无效'))
        return
      }

      resolve({
        image,
        mimeType: blob.type || DEFAULT_IMAGE_MIME_TYPE,
        width,
        height
      })
    }

    image.onerror = () => {
      cleanup()
      reject(createParserError('ImageParser 图片解码失败：图片内容不可解码'))
    }

    image.src = objectUrl
  })
}

function toPoint(value: unknown): OcrPoint | undefined {
  if (!Array.isArray(value) || value.length < 2) return undefined

  const [rawX, rawY] = value as readonly unknown[]
  if (
    typeof rawX !== 'number' ||
    typeof rawY !== 'number' ||
    !Number.isFinite(rawX) ||
    !Number.isFinite(rawY)
  ) {
    return undefined
  }

  return [rawX, rawY]
}

function toPointList(value: unknown): readonly OcrPoint[] {
  if (!Array.isArray(value)) return []

  return value.reduce<OcrPoint[]>((points, entry) => {
    const point = toPoint(entry)
    if (point) points.push(point)
    return points
  }, [])
}

function toBoundingBoxFromPoints(
  points: readonly OcrPoint[],
  image: Pick<DecodedImage, 'width' | 'height'>
): BoundingBox | undefined {
  if (points.length === 0) return undefined

  if (points.length === 1) {
    const [pointX, pointY] = points[0]

    return {
      x: clampNumber(pointX, 0, Math.max(0, image.width - 1)),
      y: clampNumber(pointY, 0, Math.max(0, image.height - 1)),
      width: 1,
      height: 1
    }
  }

  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  const right = Math.max(...xs)
  const bottom = Math.max(...ys)

  const maxLeft = Math.max(0, image.width - 1)
  const maxTop = Math.max(0, image.height - 1)
  const clampedLeft = Math.min(Math.max(0, left), maxLeft)
  const clampedTop = Math.min(Math.max(0, top), maxTop)
  const clampedRight = Math.min(Math.max(clampedLeft + 1, right), image.width)
  const clampedBottom = Math.min(Math.max(clampedTop + 1, bottom), image.height)

  if (clampedRight <= clampedLeft || clampedBottom <= clampedTop) {
    return undefined
  }

  return {
    x: clampedLeft,
    y: clampedTop,
    width: Math.max(1, clampedRight - clampedLeft),
    height: Math.max(1, clampedBottom - clampedTop)
  }
}

function getDefaultOcrStyleHints(): OcrStyleHints {
  return {
    italic: DEFAULT_TEXT_ITALIC,
    skew: DEFAULT_TEXT_SKEW
  }
}

function getPointKey([x, y]: OcrPoint): string {
  return `${x}:${y}`
}

function getPolygonCenter(points: readonly OcrPoint[]): OcrPoint {
  const { x, y } = points.reduce(
    (accumulator, [pointX, pointY]) => ({
      x: accumulator.x + pointX,
      y: accumulator.y + pointY
    }),
    { x: 0, y: 0 }
  )

  return [x / points.length, y / points.length]
}

function getNormalizedPolygonStartIndex(
  clockwisePoints: readonly OcrPoint[],
  _center: OcrPoint
): number {
  const topPointXWeight = 0.15

  return clockwisePoints.reduce(
    (bestCandidate, point, index) => {
      const pointScore = point[1] + point[0] * topPointXWeight
      const bestScore =
        bestCandidate.point[1] + bestCandidate.point[0] * topPointXWeight

      if (pointScore !== bestScore) {
        return pointScore < bestScore ? { index, point } : bestCandidate
      }

      return point[0] < bestCandidate.point[0]
        ? { index, point }
        : bestCandidate
    },
    {
      index: 0,
      point: clockwisePoints[0] as OcrPoint
    }
  ).index
}

function normalizeQuadrilateralPoints(
  points: readonly OcrPoint[]
): readonly [OcrPoint, OcrPoint, OcrPoint, OcrPoint] | undefined {
  if (points.length !== 4) return undefined

  const center = getPolygonCenter(points)
  const angleSortedPoints = [...points].sort((left, right) => {
    const leftAngle = Math.atan2(left[1] - center[1], left[0] - center[0])
    const rightAngle = Math.atan2(right[1] - center[1], right[0] - center[0])

    if (leftAngle !== rightAngle) return leftAngle - rightAngle

    return getPointDistance(center, left) - getPointDistance(center, right)
  })

  const clockwisePoints =
    getPolygonSignedArea(angleSortedPoints) > 0
      ? angleSortedPoints
      : [...angleSortedPoints].reverse()

  const startIndex = getNormalizedPolygonStartIndex(clockwisePoints, center)

  const [topLeft, topRight, bottomRight, bottomLeft] = clockwisePoints.map(
    (_point, index) =>
      clockwisePoints[(startIndex + index) % clockwisePoints.length]
  ) as [
    OcrPoint | undefined,
    OcrPoint | undefined,
    OcrPoint | undefined,
    OcrPoint | undefined
  ]

  if (!topLeft || !topRight || !bottomRight || !bottomLeft) return undefined

  const normalizedPoints: readonly [OcrPoint, OcrPoint, OcrPoint, OcrPoint] = [
    topLeft,
    topRight,
    bottomRight,
    bottomLeft
  ]

  return normalizedPoints
}

function toRawOrderedPolygon(
  points: readonly OcrPoint[]
): OrderedOcrPolygon | undefined {
  if (points.length !== 4) return undefined

  const uniquePoints = new Set(points.map((point) => getPointKey(point)))
  if (uniquePoints.size !== 4) return undefined

  const normalizedPoints = normalizeQuadrilateralPoints(points)
  if (!normalizedPoints) return undefined

  const [topLeft, topRight, bottomRight, bottomLeft] = normalizedPoints

  if (!topLeft || !topRight || !bottomRight || !bottomLeft) return undefined

  return {
    topLeft,
    topRight,
    bottomRight,
    bottomLeft
  }
}

function getPointDistance(start: OcrPoint, end: OcrPoint): number {
  const [startX, startY] = start
  const [endX, endY] = end
  return Math.hypot(endX - startX, endY - startY)
}

function getAngleDegrees(start: OcrPoint, end: OcrPoint): number {
  const [startX, startY] = start
  const [endX, endY] = end
  return (Math.atan2(endY - startY, endX - startX) * 180) / Math.PI
}

function normalizeAngleDegrees(value: number): number {
  let normalizedValue = value

  while (normalizedValue <= -180) normalizedValue += 360
  while (normalizedValue > 180) normalizedValue -= 360

  return normalizedValue
}

function getAngleDeltaDegrees(left: number, right: number): number {
  return Math.abs(normalizeAngleDegrees(left - right))
}

function averageAnglesDegrees(values: readonly number[]): number {
  if (values.length === 0) return DEFAULT_TEXT_ROTATE

  const { x, y } = values.reduce(
    (accumulator, value) => ({
      x: accumulator.x + Math.cos((value * Math.PI) / 180),
      y: accumulator.y + Math.sin((value * Math.PI) / 180)
    }),
    { x: 0, y: 0 }
  )

  if (x === 0 && y === 0) return DEFAULT_TEXT_ROTATE
  return (Math.atan2(y, x) * 180) / Math.PI
}

function getOrderedPolygonPoints(
  polygon: OrderedOcrPolygon
): readonly OcrPoint[] {
  return [
    polygon.topLeft,
    polygon.topRight,
    polygon.bottomRight,
    polygon.bottomLeft
  ]
}

function toIntermediateTextPolygonPoint([x, y]: OcrPoint): [number, number] {
  return [x, y]
}

function createIntermediateTextPolygonFromOrderedPolygon(
  polygon: OrderedOcrPolygon
): IntermediateTextPolygon {
  return [
    toIntermediateTextPolygonPoint(polygon.topLeft),
    toIntermediateTextPolygonPoint(polygon.topRight),
    toIntermediateTextPolygonPoint(polygon.bottomRight),
    toIntermediateTextPolygonPoint(polygon.bottomLeft)
  ]
}

function createIntermediateTextPolygonFromGeometry(
  geometry: Pick<OcrTextGeometry, 'height' | 'rotate' | 'width' | 'x' | 'y'>
): IntermediateTextPolygon {
  const radians = (geometry.rotate * Math.PI) / 180
  const cosine = Math.cos(radians)
  const sine = Math.sin(radians)
  const topLeft = toIntermediateTextPolygonPoint([geometry.x, geometry.y])
  const topRight = toIntermediateTextPolygonPoint([
    roundToSingleDecimal(geometry.x + geometry.width * cosine),
    roundToSingleDecimal(geometry.y + geometry.width * sine)
  ])
  const bottomLeft = toIntermediateTextPolygonPoint([
    roundToSingleDecimal(geometry.x - geometry.height * sine),
    roundToSingleDecimal(geometry.y + geometry.height * cosine)
  ])

  return [
    topLeft,
    topRight,
    toIntermediateTextPolygonPoint([
      roundToSingleDecimal(topRight[0] + bottomLeft[0] - topLeft[0]),
      roundToSingleDecimal(topRight[1] + bottomLeft[1] - topLeft[1])
    ]),
    bottomLeft
  ]
}

function createIntermediateTextPolygon(
  block: NormalizedOcrTextBlock
): IntermediateTextPolygon {
  return block.polygon
    ? createIntermediateTextPolygonFromOrderedPolygon(block.polygon)
    : createIntermediateTextPolygonFromGeometry(block.geometry)
}

function toTextPolygonPoint(value: unknown): OcrPoint | undefined {
  const point = toPoint(value)
  if (!point) return undefined
  return [point[0], point[1]]
}

function toTextPolygonPoints(
  polygon: IntermediateText['polygon']
): readonly [OcrPoint, OcrPoint, OcrPoint, OcrPoint] | undefined {
  if (!Array.isArray(polygon) || polygon.length !== 4) return undefined

  const normalizedPoints = normalizeQuadrilateralPoints(
    polygon
      .map(toTextPolygonPoint)
      .filter((point): point is OcrPoint => point !== undefined)
  )

  if (!normalizedPoints) {
    return undefined
  }

  const [topLeft, topRight, bottomRight, bottomLeft] = normalizedPoints

  if (!topLeft || !topRight || !bottomRight || !bottomLeft) {
    return undefined
  }

  return [topLeft, topRight, bottomRight, bottomLeft]
}

function getTextAdvanceLength(
  polygon: readonly [OcrPoint, OcrPoint, OcrPoint, OcrPoint],
  isVertical: boolean
): number | undefined {
  const lengths = isVertical
    ? [
        getPointDistance(polygon[0], polygon[3]),
        getPointDistance(polygon[1], polygon[2])
      ]
    : [
        getPointDistance(polygon[0], polygon[1]),
        getPointDistance(polygon[3], polygon[2])
      ]
  const length =
    lengths.reduce((sum, edgeLength) => sum + edgeLength, 0) / lengths.length

  return Number.isFinite(length) && length > 0 ? length : undefined
}

function getTextCrossLength(
  polygon: readonly [OcrPoint, OcrPoint, OcrPoint, OcrPoint],
  isVertical: boolean
): number {
  const lengths = isVertical
    ? [
        getPointDistance(polygon[0], polygon[1]),
        getPointDistance(polygon[3], polygon[2])
      ]
    : [
        getPointDistance(polygon[0], polygon[3]),
        getPointDistance(polygon[1], polygon[2])
      ]
  const length =
    lengths.reduce((sum, edgeLength) => sum + edgeLength, 0) / lengths.length

  return Number.isFinite(length) && length > 0 ? length : 1
}

function createDefaultTextPolygon(): readonly [
  OcrPoint,
  OcrPoint,
  OcrPoint,
  OcrPoint
] {
  return [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1]
  ]
}

function getNormalizedEdgeDirection(start: OcrPoint, end: OcrPoint): OcrPoint {
  const length = getPointDistance(start, end)
  if (!Number.isFinite(length) || length <= 0) return [0, 0]

  return [(end[0] - start[0]) / length, (end[1] - start[1]) / length]
}

function resolveTextBaselineOrigin(
  polygon: readonly [OcrPoint, OcrPoint, OcrPoint, OcrPoint],
  ascent: number,
  isVertical: boolean
): OcrPoint {
  const [topLeft, topRight, , bottomLeft] = polygon
  const horizontalAxis = getNormalizedEdgeDirection(topLeft, topRight)
  const verticalAxis = getNormalizedEdgeDirection(topLeft, bottomLeft)
  const baselineOffset = isVertical
    ? ([-horizontalAxis[0], -horizontalAxis[1]] as OcrPoint)
    : verticalAxis

  return [
    topLeft[0] + baselineOffset[0] * ascent,
    topLeft[1] + baselineOffset[1] * ascent
  ]
}

function readIntermediateText(
  text: IntermediateText
): StandardizedIntermediateText {
  const polygon =
    toTextPolygonPoints(text.polygon) ?? createDefaultTextPolygon()
  const isVertical = text.vertical === true || text.dir === TextDir.TTB
  const fontSize = normalizeDimension(
    text.fontSize,
    Math.max(1, Math.round(getTextCrossLength(polygon, isVertical)))
  )
  const ascent = Number.isFinite(text.ascent)
    ? Math.max(0, text.ascent)
    : fontSize
  const baseRotation = getSafeAngle(
    normalizeAngleDegrees(getAngleDegrees(polygon[0], polygon[1])),
    MAX_TEXT_ROTATE
  )

  return {
    ascent,
    baselineOrigin: resolveTextBaselineOrigin(polygon, ascent, isVertical),
    color: text.color.trim() || '#000000',
    content: text.content,
    direction: text.dir === TextDir.RTL ? 'rtl' : 'ltr',
    fontFamily: text.fontFamily.trim() || DEFAULT_FONT_FAMILY,
    fontSize,
    fontWeight: getSafeFontWeight(text.fontWeight),
    italic: text.italic === true,
    rotation: getSafeAngle(
      isVertical ? normalizeAngleDegrees(baseRotation + 90) : baseRotation,
      MAX_TEXT_ROTATE
    ),
    skew: getSafeAngle(text.skew, MAX_TEXT_SKEW),
    targetWidth: getTextAdvanceLength(polygon, isVertical)
  }
}

function getPolygonSignedArea(points: readonly OcrPoint[]): number {
  return points.reduce((area, point, index) => {
    const nextPoint = points[(index + 1) % points.length]
    if (!nextPoint) return area

    return area + point[0] * nextPoint[1] - nextPoint[0] * point[1]
  }, 0)
}

function getCrossProductZ(
  start: OcrPoint,
  middle: OcrPoint,
  end: OcrPoint
): number {
  const abX = middle[0] - start[0]
  const abY = middle[1] - start[1]
  const bcX = end[0] - middle[0]
  const bcY = end[1] - middle[1]
  return abX * bcY - abY * bcX
}

function isConvexPolygon(points: readonly OcrPoint[]): boolean {
  const crossProducts = points.map((point, index) => {
    const middle = points[(index + 1) % points.length]
    const end = points[(index + 2) % points.length]
    if (!middle || !end) return 0
    return getCrossProductZ(point, middle, end)
  })

  const nonZeroCrossProducts = crossProducts.filter(
    (value) => Math.abs(value) > Number.EPSILON
  )

  if (nonZeroCrossProducts.length !== points.length) return false

  const firstSign = Math.sign(nonZeroCrossProducts[0] ?? 0)
  return nonZeroCrossProducts.every((value) => Math.sign(value) === firstSign)
}

function hasStablePolygonGeometry(polygon: OrderedOcrPolygon): boolean {
  const edges = [
    getPointDistance(polygon.topLeft, polygon.topRight),
    getPointDistance(polygon.topRight, polygon.bottomRight),
    getPointDistance(polygon.bottomRight, polygon.bottomLeft),
    getPointDistance(polygon.bottomLeft, polygon.topLeft)
  ]

  return edges.every((edge) => edge >= MIN_GEOMETRY_EDGE_LENGTH)
}

function createBoundingBoxGeometry(box: BoundingBox): OcrTextGeometry {
  return {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    rotate: DEFAULT_TEXT_ROTATE,
    sampleBox: box
  }
}

function toRotatedTextGeometry(
  polygon: OrderedOcrPolygon,
  image: Pick<DecodedImage, 'width' | 'height'>,
  sampleBox: BoundingBox
): OcrTextGeometry | undefined {
  if (!hasStablePolygonGeometry(polygon)) return undefined

  const topAngle = getAngleDegrees(polygon.topLeft, polygon.topRight)
  const bottomAngle = getAngleDegrees(polygon.bottomLeft, polygon.bottomRight)
  const leftAngle = getAngleDegrees(polygon.topLeft, polygon.bottomLeft)
  const rightAngle = getAngleDegrees(polygon.topRight, polygon.bottomRight)

  if (
    getAngleDeltaDegrees(topAngle, bottomAngle) > MAX_PARALLEL_ANGLE_DELTA ||
    getAngleDeltaDegrees(leftAngle, rightAngle) > MAX_SIDE_ANGLE_DELTA
  ) {
    return undefined
  }

  const rotate = roundToSingleDecimal(
    normalizeAngleDegrees(averageAnglesDegrees([topAngle, bottomAngle]))
  )
  const width = roundToSingleDecimal(
    (getPointDistance(polygon.topLeft, polygon.topRight) +
      getPointDistance(polygon.bottomLeft, polygon.bottomRight)) /
      2
  )
  const height = roundToSingleDecimal(
    (getPointDistance(polygon.topLeft, polygon.bottomLeft) +
      getPointDistance(polygon.topRight, polygon.bottomRight)) /
      2
  )

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < MIN_GEOMETRY_EDGE_LENGTH ||
    height < MIN_GEOMETRY_EDGE_LENGTH
  ) {
    return undefined
  }

  const maxLeft = Math.max(0, image.width - 1)
  const maxTop = Math.max(0, image.height - 1)

  return {
    x: clampNumber(polygon.topLeft[0], 0, maxLeft),
    y: clampNumber(polygon.topLeft[1], 0, maxTop),
    width,
    height,
    rotate: Math.abs(rotate) <= MAX_TEXT_ROTATE ? rotate : DEFAULT_TEXT_ROTATE,
    sampleBox
  }
}

function inferGeometryStyleHints(
  polygon: OrderedOcrPolygon | undefined,
  rotate: number
): OcrStyleHints {
  if (!polygon || !hasStablePolygonGeometry(polygon)) {
    return getDefaultOcrStyleHints()
  }

  const leftAngle = getAngleDegrees(polygon.topLeft, polygon.bottomLeft)
  const rightAngle = getAngleDegrees(polygon.topRight, polygon.bottomRight)
  const leftSkew = normalizeAngleDegrees(leftAngle - (rotate + 90))
  const rightSkew = normalizeAngleDegrees(rightAngle - (rotate + 90))

  if (getAngleDeltaDegrees(leftSkew, rightSkew) > MAX_SKEW_SIDE_DELTA) {
    return getDefaultOcrStyleHints()
  }

  const skew = roundToSingleDecimal(
    clampNumber((leftSkew + rightSkew) / 2, -MAX_TEXT_SKEW, MAX_TEXT_SKEW)
  )
  const italic =
    Math.abs(skew) >= ITALIC_SKEW_THRESHOLD && Math.abs(skew) <= MAX_ITALIC_SKEW

  return {
    italic,
    skew: Number.isFinite(skew) ? skew : DEFAULT_TEXT_SKEW
  }
}

function getOcrTextGeometry(
  value: unknown,
  image: Pick<DecodedImage, 'width' | 'height'>
):
  | {
      geometry: OcrTextGeometry
      polygon: OrderedOcrPolygon | undefined
    }
  | undefined {
  const points = toPointList(value)
  const sampleBox = toBoundingBoxFromPoints(points, image)
  if (!sampleBox) return undefined

  const rawPolygon = toRawOrderedPolygon(points)
  if (
    !rawPolygon ||
    !isConvexPolygon(getOrderedPolygonPoints(rawPolygon)) ||
    getPolygonSignedArea(getOrderedPolygonPoints(rawPolygon)) <= Number.EPSILON
  ) {
    return {
      geometry: createBoundingBoxGeometry(sampleBox),
      polygon: undefined
    }
  }

  const geometry = toRotatedTextGeometry(rawPolygon, image, sampleBox)

  return geometry
    ? { geometry, polygon: rawPolygon }
    : {
        geometry: createBoundingBoxGeometry(sampleBox),
        polygon: undefined
      }
}

function createAnalysisCanvas(
  width: number,
  height: number
): RenderCanvas | undefined {
  if (
    typeof document === 'undefined' ||
    typeof document.createElement !== 'function'
  ) {
    return undefined
  }

  const canvas = document.createElement('canvas') as unknown as RenderCanvas
  if (!canvas || typeof canvas.getContext !== 'function') return undefined

  canvas.width = width
  canvas.height = height
  return canvas
}

function getPixelSampleStats(
  image: HTMLImageElement,
  box: BoundingBox
): PixelSampleStats | undefined {
  const sampleWidth = clampNumber(
    normalizeDimension(box.width, 1),
    1,
    MAX_PIXEL_SAMPLE_SIZE
  )
  const sampleHeight = clampNumber(
    normalizeDimension(box.height, 1),
    1,
    MAX_PIXEL_SAMPLE_SIZE
  )
  const canvas = createAnalysisCanvas(sampleWidth, sampleHeight)
  const context = canvas?.getContext('2d')

  if (!context || typeof context.drawImage !== 'function') return undefined

  const imageDataGetter = (
    context as CanvasRenderingContext2D & {
      getImageData?: (
        sx: number,
        sy: number,
        sw: number,
        sh: number
      ) => ImageData
    }
  ).getImageData

  if (typeof imageDataGetter !== 'function') return undefined

  try {
    context.drawImage(
      image,
      box.x,
      box.y,
      box.width,
      box.height,
      0,
      0,
      sampleWidth,
      sampleHeight
    )

    const { data } = imageDataGetter.call(
      context,
      0,
      0,
      sampleWidth,
      sampleHeight
    )
    let minLuminance = 255
    let maxLuminance = 0
    let opaquePixelCount = 0

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3]
      if (alpha < 16) continue

      const red = data[index] ?? 0
      const green = data[index + 1] ?? 0
      const blue = data[index + 2] ?? 0
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722

      minLuminance = Math.min(minLuminance, luminance)
      maxLuminance = Math.max(maxLuminance, luminance)
      opaquePixelCount += 1
    }

    if (opaquePixelCount < MIN_PIXEL_SAMPLE_SIZE) return undefined

    const contrast = maxLuminance - minLuminance
    if (contrast < MIN_PIXEL_SAMPLE_CONTRAST) return undefined

    const darknessThreshold = maxLuminance - contrast * 0.35
    let darkPixelCount = 0

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3]
      if (alpha < 16) continue

      const red = data[index] ?? 0
      const green = data[index + 1] ?? 0
      const blue = data[index + 2] ?? 0
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722
      if (luminance <= darknessThreshold) darkPixelCount += 1
    }

    return {
      contrast,
      darkPixelRatio: darkPixelCount / opaquePixelCount,
      opaquePixelCount
    }
  } catch {
    return undefined
  }
}

function estimateFontWeight(image: HTMLImageElement, box: BoundingBox): number {
  const pixelStats = getPixelSampleStats(image, box)
  if (!pixelStats) return DEFAULT_TEXT_FONT_WEIGHT

  const densityScore =
    pixelStats.darkPixelRatio *
    clampNumber(box.height / 24, 0.85, 1.2) *
    clampNumber(pixelStats.contrast / 96, 0.8, 1.15)

  if (densityScore >= 0.28) return FONT_WEIGHT_BUCKETS[3]
  if (densityScore >= 0.2) return FONT_WEIGHT_BUCKETS[2]
  if (densityScore >= 0.13) return FONT_WEIGHT_BUCKETS[1]
  return FONT_WEIGHT_BUCKETS[0]
}

function normalizeOcrResult(
  result: readonly OcrResultItem[] | undefined,
  decodedImage: Pick<DecodedImage, 'height' | 'image' | 'width'>
): NormalizedOcrTextBlock[] {
  const rawItems = Array.isArray(result) ? result : []

  return rawItems.reduce<NormalizedOcrTextBlock[]>((blocks, item) => {
    const content = item.text.trim()
    if (!content) return blocks

    const geometryResult = getOcrTextGeometry(item.poly, decodedImage)
    if (!geometryResult) return blocks

    const geometryStyleHints = inferGeometryStyleHints(
      geometryResult.polygon,
      geometryResult.geometry.rotate
    )
    const fontWeight = estimateFontWeight(
      decodedImage.image,
      geometryResult.geometry.sampleBox
    )

    blocks.push({
      content,
      fontWeight,
      geometry: geometryResult.geometry,
      italic: geometryStyleHints.italic,
      polygon: geometryResult.polygon,
      skew: geometryStyleHints.skew
    })

    return blocks
  }, [])
}

async function runOcr(
  image: HTMLImageElement
): Promise<readonly OcrResultItem[] | undefined> {
  const ocr = await loadPaddleOcrRuntime()

  try {
    const [result] = await ocr.predict(image)
    return result?.items
  } catch (error) {
    await clearPaddleOcrInstance()
    throw createParserError('ImageParser OCR 推理失败', error)
  }
}

function createOcrText(
  block: NormalizedOcrTextBlock,
  index: number
): IntermediateText {
  const fontSize = Math.max(1, Math.round(block.geometry.height * 0.8))
  const lineHeight = Math.max(fontSize, Math.round(block.geometry.height))
  const ascent = Math.round(lineHeight * 0.75)
  const polygon = createIntermediateTextPolygon(block)

  return new IntermediateText({
    id: `image-parser-ocr-text-${index + 1}`,
    content: block.content,
    fontSize,
    fontFamily: DEFAULT_FONT_FAMILY,
    fontWeight: block.fontWeight,
    italic: block.italic,
    color: '#000000',
    polygon,
    lineHeight,
    ascent,
    descent: Math.max(0, lineHeight - ascent),
    vertical: false,
    dir: TextDir.LTR,
    skew: block.skew,
    isEOL: true
  })
}

function getRenderPageSize(
  page: Pick<IntermediatePage, 'width' | 'height'>
): Pick<BoundingBox, 'width' | 'height'> {
  return {
    width: normalizeDimension(page.width, 1),
    height: normalizeDimension(page.height, 1)
  }
}

function getDecodeMimeType(page: IntermediatePage): Promise<string> {
  return page.getThumbnail().then((thumbnail) => {
    const normalizedThumbnail = thumbnail?.trim()

    return resolveImageMimeType(
      normalizedThumbnail
        ? parseDataUrlMimeType(normalizedThumbnail)
        : undefined
    )
  })
}

function createRenderCanvas(
  pageSize: Pick<BoundingBox, 'width' | 'height'>
): RenderCanvas {
  if (
    typeof document === 'undefined' ||
    typeof document.createElement !== 'function'
  ) {
    throw createParserError(
      'ImageParser 解码失败：画布初始化失败，当前环境不支持 document.createElement'
    )
  }

  const canvas = document.createElement('canvas') as unknown as RenderCanvas
  if (!canvas || typeof canvas.getContext !== 'function') {
    throw createParserError(
      'ImageParser 解码失败：画布初始化失败，无法创建可绘制画布'
    )
  }

  canvas.width = pageSize.width
  canvas.height = pageSize.height
  return canvas
}

function getSafeAngle(value: number, maxAbs: number): number {
  if (!Number.isFinite(value)) return 0
  if (Math.abs(value) > maxAbs) return 0
  return value
}

function getSafeFontWeight(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_TEXT_FONT_WEIGHT

  const roundedValue = Math.round(value)
  if (roundedValue < 100 || roundedValue > 900) {
    return DEFAULT_TEXT_FONT_WEIGHT
  }

  return roundedValue
}

function getCanvasTextFont(text: StandardizedIntermediateText): string {
  const style = text.italic ? 'italic ' : ''
  const weight = `${text.fontWeight} `
  const size = `${text.fontSize}px `

  return `${style}${weight}${size}${text.fontFamily}`.trim()
}

function getCanvasTextColor(text: StandardizedIntermediateText): string {
  return text.color
}

function getCanvasTextBaselineY(text: StandardizedIntermediateText): number {
  return text.baselineOrigin[1]
}

function getCanvasTextDirection(
  text: StandardizedIntermediateText
): CanvasDirection {
  return text.direction
}

function getCanvasTextTargetWidth(
  text: StandardizedIntermediateText
): number | undefined {
  const targetWidth = text.targetWidth

  return targetWidth !== undefined &&
    Number.isFinite(targetWidth) &&
    targetWidth > 0
    ? targetWidth
    : undefined
}

function getCanvasTextFallbackMaxWidth(
  text: StandardizedIntermediateText
): number {
  return getCanvasTextTargetWidth(text) ?? 1
}

function measureCanvasTextNaturalWidth(
  context: Pick<CanvasRenderingContext2D, 'measureText'>,
  content: string
): number | undefined {
  if (content.trim().length === 0) return undefined

  try {
    const measuredWidth = context.measureText(content).width
    return Number.isFinite(measuredWidth) && measuredWidth > 0
      ? measuredWidth
      : undefined
  } catch {
    return undefined
  }
}

function getCanvasTextScaleX(
  targetWidth: number | undefined,
  measuredWidth: number | undefined
): number | undefined {
  if (targetWidth === undefined || measuredWidth === undefined) return undefined

  const scaleX = targetWidth / measuredWidth
  return Number.isFinite(scaleX) && scaleX > 0 ? scaleX : undefined
}

function getCanvasTextRotation(text: StandardizedIntermediateText): number {
  return text.rotation
}

function getCanvasTextSkew(text: StandardizedIntermediateText): number {
  return text.skew
}

function drawDecodedPage(
  texts: readonly IntermediateText[],
  pageSize: Pick<BoundingBox, 'width' | 'height'>
): RenderCanvas {
  const canvas = createRenderCanvas(pageSize)
  const context = canvas.getContext('2d')

  if (!context) {
    throw createParserError(
      'ImageParser 解码失败：画布初始化失败，无法获取二维上下文'
    )
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, pageSize.width, pageSize.height)

  for (const text of texts) {
    const standardizedText = readIntermediateText(text)
    const x = standardizedText.baselineOrigin[0]
    const baselineY = getCanvasTextBaselineY(standardizedText)
    const rotation = getCanvasTextRotation(standardizedText)
    const skew = getCanvasTextSkew(standardizedText)
    const fallbackMaxWidth = getCanvasTextFallbackMaxWidth(standardizedText)

    context.save()
    context.font = getCanvasTextFont(standardizedText)
    context.fillStyle = getCanvasTextColor(standardizedText)
    context.textBaseline = 'alphabetic'
    context.direction = getCanvasTextDirection(standardizedText)
    context.translate(x, baselineY)

    if (rotation !== 0) {
      context.rotate((rotation * Math.PI) / 180)
    }

    if (skew !== 0) {
      context.transform(1, 0, Math.tan((skew * Math.PI) / 180), 1, 0, 0)
    }

    const scaleX = getCanvasTextScaleX(
      getCanvasTextTargetWidth(standardizedText),
      measureCanvasTextNaturalWidth(context, standardizedText.content)
    )

    if (scaleX !== undefined) {
      if (scaleX !== 1) {
        context.scale(scaleX, 1)
      }

      context.fillText(standardizedText.content, 0, 0)
    } else {
      context.fillText(standardizedText.content, 0, 0, fallbackMaxWidth)
    }

    context.restore()
  }

  return canvas
}

async function exportCanvasBlob(
  canvas: RenderCanvas,
  mimeType: string
): Promise<Blob | undefined> {
  const toBlob = canvas.toBlob

  if (typeof toBlob !== 'function') {
    throw createParserError(
      'ImageParser 解码失败：图片导出失败，当前环境不支持 canvas.toBlob'
    )
  }

  return new Promise<Blob | undefined>((resolve, reject) => {
    try {
      toBlob.call(canvas, (blob) => resolve(blob ?? undefined), mimeType)
    } catch (error) {
      reject(createParserError('ImageParser 解码失败：图片导出失败', error))
    }
  })
}

async function exportCanvasArrayBuffer(
  canvas: RenderCanvas,
  preferredMimeType: string
): Promise<ArrayBuffer> {
  const requestedMimeType = resolveImageMimeType(preferredMimeType)
  const blob =
    (await exportCanvasBlob(canvas, requestedMimeType)) ??
    (requestedMimeType === DEFAULT_IMAGE_MIME_TYPE
      ? undefined
      : await exportCanvasBlob(canvas, DEFAULT_IMAGE_MIME_TYPE))

  if (!blob) {
    throw createParserError('ImageParser 解码失败：图片导出失败，导出结果为空')
  }

  try {
    const arrayBuffer = await blob.arrayBuffer()

    if (arrayBuffer.byteLength <= 0) {
      throw createParserError(
        'ImageParser 解码失败：图片导出失败，导出结果为空'
      )
    }

    return arrayBuffer
  } catch (error) {
    if (error instanceof Error && error.message.includes('导出结果为空')) {
      throw error
    }

    throw createParserError('ImageParser 解码失败：图片导出失败', error)
  }
}

function createOcrDocument(
  decodedImage: DecodedImage,
  blocks: NormalizedOcrTextBlock[],
  thumbnail: string
): IntermediateDocument {
  const texts = blocks.map((block, index) => createOcrText(block, index))
  const page = new IntermediatePage({
    id: 'image-parser-ocr-page-1',
    texts,
    width: decodedImage.width,
    height: decodedImage.height,
    number: 1,
    thumbnail
  })

  const pagesMap = IntermediatePageMap.fromInfoList([
    {
      id: page.id,
      pageNumber: page.number,
      size: {
        x: page.width,
        y: page.height
      },
      getData: async () => page
    }
  ])

  return new IntermediateDocument({
    id: 'image-parser-ocr-document',
    title: `OCR Image Document (${decodedImage.mimeType})`,
    pagesMap,
    outline: undefined
  })
}

export class ImageParser extends DocumentParser {
  static readonly exts = [
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
    'bmp',
    'svg'
  ] as const

  static readonly ext = 'png'

  static async inspect(input: ParserInput): Promise<ImageParserInspection> {
    const bytes = await ImageParser.toUint8Array(input)
    const mimeType = isBlobInput(input)
      ? input.type || detectImageMimeType(bytes)
      : detectImageMimeType(bytes)

    return {
      byteLength: bytes.byteLength,
      kind: detectInputKind(input),
      message:
        'ImageParser 支持真实图片 OCR 编码；inspect 不会加载模型或执行识别。',
      mimeType,
      status: 'ocr-supported',
      supportedExtensions: [...ImageParser.exts]
    }
  }

  static async encode(input: ParserInput): Promise<IntermediateDocument> {
    const imageBlob = await toImageBlob(input)
    const decodedImage = await decodeImageBlob(imageBlob)
    const ocrResult = await runOcr(decodedImage.image)
    const blocks = normalizeOcrResult(ocrResult, decodedImage)
    const thumbnail = await createImageDataUrl(imageBlob)

    return createOcrDocument(decodedImage, blocks, thumbnail)
  }

  async encode(input: ParserInput): Promise<IntermediateDocument> {
    return ImageParser.encode(input)
  }

  static async decode(
    intermediateDocument: IntermediateDocument
  ): Promise<ArrayBuffer> {
    const pages = await intermediateDocument.pages
    const firstPage = pages[0]

    if (!firstPage) {
      throw createParserError('ImageParser 解码失败：中间文档不包含可解码页面')
    }

    const pageSize = getRenderPageSize(firstPage)
    const texts = await firstPage.getTexts()
    const canvas = drawDecodedPage(texts, pageSize)
    const mimeType = await getDecodeMimeType(firstPage)

    return exportCanvasArrayBuffer(canvas, mimeType)
  }

  async decode(
    intermediateDocument: IntermediateDocument
  ): Promise<ParserInput> {
    return ImageParser.decode(intermediateDocument)
  }
}

export async function inspectImage(
  input: ParserInput
): Promise<ImageParserInspection> {
  return ImageParser.inspect(input)
}
