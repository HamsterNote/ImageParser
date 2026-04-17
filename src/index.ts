import { DocumentParser, type ParserInput } from '@hamster-note/document-parser'
import {
  IntermediateDocument,
  IntermediatePage,
  IntermediatePageMap,
  IntermediateText,
  TextDir
} from '@hamster-note/types'
import type * as PaddleOcr from '@paddlejs-models/ocr'

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

interface RenderCanvas {
  getContext(contextId: '2d'): CanvasRenderingContext2D | null
  height: number
  toBlob?: (callback: BlobCallback, type?: string, quality?: number) => void
  width: number
}

interface NormalizedOcrTextBlock {
  box: BoundingBox
  content: string
}

interface PaddleOcrRuntime {
  init: typeof PaddleOcr.init
  recognize: typeof PaddleOcr.recognize
}

const DEFAULT_IMAGE_MIME_TYPE = 'image/png'
const DEFAULT_FONT_FAMILY = 'sans-serif'
const PNG_SIGNATURE = [137, 80, 78, 71] as const
const JPEG_SIGNATURE = [255, 216, 255] as const

let paddleOcrRuntimePromise: Promise<PaddleOcrRuntime> | undefined

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

function isPaddleOcrRuntime(value: unknown): value is PaddleOcrRuntime {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as {
    init?: unknown
    recognize?: unknown
  }

  return (
    typeof candidate.init === 'function' &&
    typeof candidate.recognize === 'function'
  )
}

function resolvePaddleOcrRuntime(value: unknown): PaddleOcrRuntime {
  if (isPaddleOcrRuntime(value)) return value

  if (typeof value === 'object' && value !== null && 'default' in value) {
    const candidate = value as { default?: unknown }
    if (isPaddleOcrRuntime(candidate.default)) return candidate.default
  }

  throw createParserError('ImageParser OCR 模型加载失败：OCR 模块接口不可用')
}

async function loadPaddleOcrRuntime(): Promise<PaddleOcrRuntime> {
  if (!paddleOcrRuntimePromise) {
    paddleOcrRuntimePromise = import('@paddlejs-models/ocr')
      .then(async (ocrModule) => {
        const runtime = resolvePaddleOcrRuntime(ocrModule)
        await runtime.init()
        return runtime
      })
      .catch((error: unknown) => {
        paddleOcrRuntimePromise = undefined
        throw createParserError('ImageParser OCR 模型加载失败', error)
      })
  }

  return paddleOcrRuntimePromise
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

function toPoint(value: unknown): readonly [number, number] | undefined {
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

function toPointList(value: unknown): readonly (readonly [number, number])[] {
  if (!Array.isArray(value)) return []

  return value.reduce<(readonly [number, number])[]>((points, entry) => {
    const point = toPoint(entry)
    if (point) points.push(point)
    return points
  }, [])
}

function getFallbackBox(
  image: Pick<DecodedImage, 'width' | 'height'>,
  content: string,
  index: number
): BoundingBox {
  const height = 24
  const width = Math.min(image.width, Math.max(1, content.length * 12))
  const y = Math.min(
    Math.max(0, index * 28),
    Math.max(0, image.height - height)
  )

  return { x: 0, y, width, height }
}

function toBoundingBox(
  value: unknown,
  image: Pick<DecodedImage, 'width' | 'height'>,
  content: string,
  index: number
): BoundingBox {
  const points = toPointList(value)
  if (points.length === 0) return getFallbackBox(image, content, index)

  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  const right = Math.max(...xs)
  const bottom = Math.max(...ys)

  return {
    x: Math.max(0, left),
    y: Math.max(0, top),
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top)
  }
}

function normalizeOcrResult(
  result: PaddleOcr.OCRResult,
  image: Pick<DecodedImage, 'width' | 'height'>
): NormalizedOcrTextBlock[] {
  const rawTexts: readonly string[] = Array.isArray(result.text)
    ? result.text
    : []
  const rawPoints: readonly unknown[] = Array.isArray(result.points)
    ? result.points
    : []

  return rawTexts.reduce<NormalizedOcrTextBlock[]>((blocks, rawText, index) => {
    const content = rawText.trim()
    if (!content) return blocks

    blocks.push({
      box: toBoundingBox(rawPoints[index], image, content, index),
      content
    })
    return blocks
  }, [])
}

async function runOcr(image: HTMLImageElement): Promise<PaddleOcr.OCRResult> {
  const ocr = await loadPaddleOcrRuntime()

  try {
    return await ocr.recognize(image)
  } catch (error) {
    throw createParserError('ImageParser OCR 推理失败', error)
  }
}

function createOcrText(
  block: NormalizedOcrTextBlock,
  index: number
): IntermediateText {
  const fontSize = Math.max(1, Math.round(Math.min(24, block.box.height)))
  const lineHeight = Math.max(fontSize, Math.round(block.box.height))
  const ascent = Math.round(lineHeight * 0.75)

  return new IntermediateText({
    id: `image-parser-ocr-text-${index + 1}`,
    content: block.content,
    fontSize,
    fontFamily: DEFAULT_FONT_FAMILY,
    fontWeight: 400,
    italic: false,
    color: '#0f172a',
    width: block.box.width,
    height: block.box.height,
    lineHeight,
    x: block.box.x,
    y: block.box.y,
    ascent,
    descent: Math.max(0, lineHeight - ascent),
    dir: TextDir.LTR,
    rotate: 0,
    skew: 0,
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

function getCanvasTextFont(text: IntermediateText): string {
  const style = text.italic ? 'italic ' : ''
  const weight = Number.isFinite(text.fontWeight)
    ? `${Math.max(1, Math.round(text.fontWeight))} `
    : ''
  const size = normalizeDimension(
    text.fontSize,
    Math.max(1, Math.round(text.height))
  )
  const family = text.fontFamily.trim() || DEFAULT_FONT_FAMILY

  return `${style}${weight}${size}px ${family}`.trim()
}

function getCanvasTextColor(text: IntermediateText): string {
  const color = text.color.trim()
  return color ? color : '#000000'
}

function getCanvasTextBaselineY(text: IntermediateText): number {
  const y = Number.isFinite(text.y) ? text.y : 0
  const ascent = Number.isFinite(text.ascent)
    ? Math.max(0, text.ascent)
    : normalizeDimension(text.fontSize, Math.max(1, Math.round(text.height)))

  return y + ascent
}

function getCanvasTextDirection(text: IntermediateText): CanvasDirection {
  return text.dir === TextDir.RTL ? 'rtl' : 'ltr'
}

function getCanvasTextRotation(text: IntermediateText): number {
  const baseRotate = Number.isFinite(text.rotate) ? text.rotate : 0
  return text.vertical || text.dir === TextDir.TTB
    ? baseRotate + 90
    : baseRotate
}

function getCanvasTextSkew(text: IntermediateText): number {
  return Number.isFinite(text.skew) ? text.skew : 0
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
    const x = Number.isFinite(text.x) ? text.x : 0
    const baselineY = getCanvasTextBaselineY(text)
    const rotation = getCanvasTextRotation(text)
    const skew = getCanvasTextSkew(text)

    context.save()
    context.font = getCanvasTextFont(text)
    context.fillStyle = getCanvasTextColor(text)
    context.textBaseline = 'alphabetic'
    context.direction = getCanvasTextDirection(text)
    context.translate(x, baselineY)

    if (rotation !== 0) {
      context.rotate((rotation * Math.PI) / 180)
    }

    if (skew !== 0) {
      context.transform(1, 0, Math.tan((skew * Math.PI) / 180), 1, 0, 0)
    }

    context.fillText(text.content, 0, 0, Math.max(1, text.width))
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
