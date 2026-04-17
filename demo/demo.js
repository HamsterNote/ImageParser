import { IntermediateDocument } from '@hamster-note/types'
import { recognize } from '@paddlejs-models/ocr'

import { ImageParser } from '../dist/index.js'

const PNG_SIGNATURE = [137, 80, 78, 71]
const JPEG_SIGNATURE = [255, 216, 255]
const DEFAULT_IMAGE_MIME_TYPE = 'image/png'

const decodeButton = document.querySelector('[data-action="decode"]')
const inspectButton = document.querySelector('[data-action="inspect"]')
const imageInput = document.querySelector('[data-role="image-input"]')
const rawOutput = document.querySelector('[data-role="raw-output"]')
const documentOutput = document.querySelector('[data-role="document-output"]')
const status = document.querySelector('[data-role="status"]')
const summary = document.querySelector('[data-role="summary"]')
const overlayPreview = document.querySelector('[data-role="overlay-preview"]')
const overlayPlaceholder = document.querySelector(
  '[data-role="overlay-placeholder"]'
)
const decodeImage = document.querySelector('[data-role="decode-image"]')
const decodeMeta = document.querySelector('[data-role="decode-meta"]')
const decodePlaceholder = document.querySelector(
  '[data-role="decode-placeholder"]'
)

let latestDecodeResultUrl
let latestDocument

const setStatus = (text) => {
  if (status) {
    status.textContent = text
  }
}

const setSummary = (text) => {
  if (summary) {
    summary.textContent = text
  }
}

const setOutput = (element, value) => {
  if (element) {
    element.textContent =
      typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  }
}

const setDecodeEnabled = (enabled) => {
  if (decodeButton instanceof HTMLButtonElement) {
    decodeButton.disabled = !enabled
  }
}

const getSelectedImage = () => {
  if (!(imageInput instanceof HTMLInputElement)) return undefined
  return imageInput.files?.[0]
}

const createDocumentSnapshot = async (document) => {
  const serialized = await IntermediateDocument.serialize(document)

  return {
    emptyResult: serialized.pages.every((page) => page.texts.length === 0),
    parsed: IntermediateDocument.parse(serialized),
    value: serialized
  }
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const normalizeDimension = (value, fallback) => {
  if (!Number.isFinite(value) || value <= 0) return fallback
  return Math.max(1, Math.round(value))
}

const hasSignature = (bytes, signature, offset = 0) => {
  return signature.every((value, index) => bytes[offset + index] === value)
}

const startsWithAscii = (bytes, value, offset = 0) => {
  return [...value].every(
    (character, index) => bytes[offset + index] === character.charCodeAt(0)
  )
}

const detectSvgMimeType = (bytes) => {
  const prefix = String.fromCharCode(...bytes.slice(0, 256)).trimStart()
  return prefix.startsWith('<svg') ||
    (prefix.startsWith('<?xml') && prefix.includes('<svg'))
    ? 'image/svg+xml'
    : undefined
}

const detectImageMimeType = (bytes) => {
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

const loadImageElement = async (src) => {
  return await new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => {
      reject(new Error('图片加载失败，无法展示 OCR 预览。'))
    }
    image.src = src
  })
}

const runRawOcr = async (imageFile) => {
  const objectUrl = URL.createObjectURL(imageFile)

  try {
    const image = await loadImageElement(objectUrl)
    return recognize(image)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

const getPreviewLineWidth = (pageWidth, pageHeight) => {
  return Math.max(1, Math.round(Math.max(pageWidth, pageHeight) / 240))
}

const resetOverlayPreview = (message) => {
  if (overlayPreview instanceof HTMLCanvasElement) {
    const context = overlayPreview.getContext('2d')
    context?.clearRect(0, 0, overlayPreview.width, overlayPreview.height)
    overlayPreview.hidden = true
  }

  if (overlayPlaceholder) {
    overlayPlaceholder.hidden = false
    overlayPlaceholder.textContent = message
  }
}

const revokeDecodeResultUrl = () => {
  if (latestDecodeResultUrl) {
    URL.revokeObjectURL(latestDecodeResultUrl)
    latestDecodeResultUrl = undefined
  }
}

const resetDecodeResult = (message) => {
  revokeDecodeResultUrl()

  if (decodeImage instanceof HTMLImageElement) {
    decodeImage.hidden = true
    decodeImage.removeAttribute('src')
  }

  if (decodeMeta) {
    decodeMeta.hidden = true
    decodeMeta.textContent = ''
  }

  if (decodePlaceholder) {
    decodePlaceholder.hidden = false
    decodePlaceholder.textContent = message
  }
}

const getFirstPageData = async (document) => {
  const pages = await document.pages
  const firstPage = pages[0]

  if (!firstPage) {
    throw new Error('中间文档缺少页面，无法展示预览。')
  }

  const width = normalizeDimension(firstPage.width, 1)
  const height = normalizeDimension(firstPage.height, 1)
  const thumbnail = await firstPage.getThumbnail()
  const texts = await firstPage.getTexts()

  if (!thumbnail) {
    throw new Error('中间文档缺少原图数据，无法展示预览。')
  }

  return {
    height,
    texts,
    thumbnail,
    width
  }
}

const clampBoundingBox = (text, pageWidth, pageHeight) => {
  const x = Number.isFinite(text.x) ? text.x : 0
  const y = Number.isFinite(text.y) ? text.y : 0
  const width = normalizeDimension(text.width, 1)
  const height = normalizeDimension(text.height, 1)
  const left = clamp(x, 0, Math.max(0, pageWidth - 1))
  const top = clamp(y, 0, Math.max(0, pageHeight - 1))
  const right = clamp(x + width, left + 1, pageWidth)
  const bottom = clamp(y + height, top + 1, pageHeight)

  return {
    height: Math.max(1, bottom - top),
    width: Math.max(1, right - left),
    x: left,
    y: top
  }
}

const renderOverlayPreview = async (document) => {
  if (!(overlayPreview instanceof HTMLCanvasElement)) return

  const page = await getFirstPageData(document)
  const image = await loadImageElement(page.thumbnail)
  const context = overlayPreview.getContext('2d')

  if (!context) {
    throw new Error('预览画布初始化失败。')
  }

  overlayPreview.width = page.width
  overlayPreview.height = page.height
  context.clearRect(0, 0, page.width, page.height)
  context.drawImage(image, 0, 0, page.width, page.height)
  context.strokeStyle = '#ff3b30'
  context.lineWidth = getPreviewLineWidth(page.width, page.height)

  for (const text of page.texts) {
    const box = clampBoundingBox(text, page.width, page.height)
    context.strokeRect(box.x, box.y, box.width, box.height)
  }

  overlayPreview.hidden = false

  if (overlayPlaceholder) {
    overlayPlaceholder.hidden = true
  }
}

const createDecodeArtifact = (decodedBuffer) => {
  const bytes = new Uint8Array(decodedBuffer)
  const mimeType = detectImageMimeType(bytes) || DEFAULT_IMAGE_MIME_TYPE
  const blob = new Blob([decodedBuffer], { type: mimeType })

  return {
    byteLength: decodedBuffer.byteLength,
    mimeType,
    objectUrl: URL.createObjectURL(blob)
  }
}

const showDecodeResult = (artifact) => {
  if (decodeImage instanceof HTMLImageElement) {
    decodeImage.hidden = false
    decodeImage.src = artifact.objectUrl
  }

  if (decodeMeta) {
    decodeMeta.hidden = false
    decodeMeta.textContent = `source=ImageParser.decode() mime=${artifact.mimeType} bytes=${artifact.byteLength}`
  }

  if (decodePlaceholder) {
    decodePlaceholder.hidden = true
  }
}

const resetResultPanels = (overlayMessage, decodeMessage) => {
  resetOverlayPreview(overlayMessage)
  resetDecodeResult(decodeMessage)
}

const handleInspect = async () => {
  if (!rawOutput || !documentOutput) return

  const image = getSelectedImage()
  if (!image) {
    latestDocument = undefined
    setDecodeEnabled(false)
    setStatus('Waiting for image')
    setSummary('请选择一张图片后再运行 OCR。')
    setOutput(rawOutput, 'No OCR result yet.')
    setOutput(documentOutput, 'No intermediate document yet.')
    resetResultPanels('No overlay preview yet.', 'No decode result yet.')
    return
  }

  latestDocument = undefined
  setDecodeEnabled(false)
  setStatus('Running OCR...')
  setSummary('正在分别展示 Paddle OCR 原始结果、ImageParser 中间态文档与原图标注预览。')
  setOutput(rawOutput, 'Working...')
  setOutput(documentOutput, 'Working...')
  resetResultPanels('Rendering overlay preview...', 'No decode result yet.')

  try {
    const inspection = await ImageParser.inspect(image)
    const document = await ImageParser.encode(image)
    const documentSnapshot = await createDocumentSnapshot(document)
    const rawOcrResult = await runRawOcr(image)

    latestDocument = documentSnapshot.parsed
    await renderOverlayPreview(documentSnapshot.parsed)
    resetDecodeResult('Click Decode to render the exported image.')
    setDecodeEnabled(true)
    setSummary(
      documentSnapshot.emptyResult
        ? 'OCR 成功，但未识别到文字；下方预览与 Decode 将基于右侧中间文档展示。'
        : 'OCR 成功；左侧为原始 OCR，右侧为中间态文档，下方预览与 Decode 均基于该文档。'
    )
    setOutput(rawOutput, {
      inspection,
      rawOcrResult
    })
    setOutput(documentOutput, {
      inspection,
      intermediateDocument: documentSnapshot.value
    })
    setStatus(documentSnapshot.emptyResult ? 'No text found' : 'Done')
  } catch (error) {
    latestDocument = undefined
    setDecodeEnabled(false)
    setSummary('OCR 执行失败；请确认图片可解码、模型资源可加载。')
    setOutput(rawOutput, {
      error: error instanceof Error ? error.message : String(error)
    })
    setOutput(documentOutput, {
      error: error instanceof Error ? error.message : String(error)
    })
    resetResultPanels('Overlay preview unavailable.', 'Decode result unavailable.')
    setStatus('Failed')
  }
}

const handleDecode = async () => {
  if (!latestDocument) {
    setSummary('请先运行 OCR，生成可解码的中间文档。')
    resetDecodeResult('No decode result yet.')
    return
  }

  setDecodeEnabled(false)
  setStatus('Decoding...')
  setSummary('正在基于右侧中间文档调用 ImageParser.decode() 导出带标注的图片。')
  resetDecodeResult('Decoding...')

  try {
    const decodedBuffer = await ImageParser.decode(latestDocument)
    const artifact = createDecodeArtifact(decodedBuffer)
    latestDecodeResultUrl = artifact.objectUrl
    showDecodeResult(artifact)
    setSummary('解码完成；下方展示的是 ImageParser.decode() 返回结果生成的图片产物。')
    setStatus('Decoded')
  } catch (error) {
    resetDecodeResult(
      error instanceof Error ? error.message : 'Decode failed unexpectedly.'
    )
    setSummary('Decode 失败；请检查中间文档是否包含原图与有效坐标。')
    setStatus('Decode failed')
  } finally {
    setDecodeEnabled(Boolean(latestDocument))
  }
}

setDecodeEnabled(false)
resetResultPanels('No overlay preview yet.', 'No decode result yet.')

if (inspectButton) {
  inspectButton.addEventListener('click', () => {
    void handleInspect()
  })
}

if (decodeButton) {
  decodeButton.addEventListener('click', () => {
    void handleDecode()
  })
}
