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
let imageParserPromise
let intermediateDocumentApiPromise
let demoPaddleOcrModulePromise

const loadImageParser = async () => {
  if (!imageParserPromise) {
    imageParserPromise = import('../dist/index.js')
      .then((module) => module.ImageParser)
      .catch((error) => {
        imageParserPromise = undefined
        throw error
      })
  }

  return imageParserPromise
}

const loadDemoPaddleOcrModule = async () => {
  if (!demoPaddleOcrModulePromise) {
    demoPaddleOcrModulePromise = import('./paddlejs-ocr-shim.js').catch(
      (error) => {
        demoPaddleOcrModulePromise = undefined
        throw error
      }
    )
  }

  return demoPaddleOcrModulePromise
}

const loadIntermediateDocumentApi = async () => {
  if (!intermediateDocumentApiPromise) {
    intermediateDocumentApiPromise = import('@hamster-note/types')
      .then((module) => module.IntermediateDocument)
      .catch((error) => {
        intermediateDocumentApiPromise = undefined
        throw error
      })
  }

  return intermediateDocumentApiPromise
}

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
  const IntermediateDocument = await loadIntermediateDocumentApi()
  const serialized = await IntermediateDocument.serialize(document)
  const textCount = serialized.pages.reduce(
    (count, page) => count + page.texts.length,
    0
  )

  return {
    emptyResult: serialized.pages.every((page) => page.texts.length === 0),
    parsed: IntermediateDocument.parse(serialized),
    textCount,
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

const getPreviewLineWidth = (pageWidth, pageHeight) => {
  return Math.max(1, Math.round(Math.max(pageWidth, pageHeight) / 240))
}

const hasNonDefaultStyleValue = (value, defaultValue = 0) => {
  return Number.isFinite(value) && value !== defaultValue
}

const getSafeAngle = (value, maxAbs = 180) => {
  if (!Number.isFinite(value)) return 0
  if (Math.abs(value) > maxAbs) return 0
  return value
}

const formatOverlayStyleLabel = (text) => {
  const labels = []

  if (hasNonDefaultStyleValue(text.fontWeight, 400)) {
    labels.push(`w${Math.round(text.fontWeight)}`)
  }

  if (text.italic === true) {
    labels.push('italic')
  }

  if (hasNonDefaultStyleValue(text.rotate, 0)) {
    labels.push(`r${Math.round(text.rotate)}`)
  }

  if (hasNonDefaultStyleValue(text.skew, 0)) {
    labels.push(`s${Math.round(text.skew)}`)
  }

  return labels.join(' ')
}

const countStyledTexts = (texts) => {
  return texts.filter((text) => formatOverlayStyleLabel(text).length > 0).length
}

const extractRecognizedTexts = (snapshot) => {
  return snapshot.pages.flatMap((page, pageIndex) => {
    return page.texts.map((text, textIndex) => ({
      content: text.content,
      fontSize: text.fontSize,
      fontWeight: text.fontWeight,
      height: text.height,
      italic: text.italic,
      order: textIndex + 1,
      page: pageIndex + 1,
      rotate: text.rotate,
      skew: text.skew,
      width: text.width,
      x: text.x,
      y: text.y
    }))
  })
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

const normalizePositiveSize = (value, fallback = 1) => {
  if (!Number.isFinite(value) || value <= 0) return fallback
  return Math.max(fallback, value)
}

const getOverlayPolygon = (text, pageWidth, pageHeight) => {
  const x = Number.isFinite(text.x) ? text.x : 0
  const y = Number.isFinite(text.y) ? text.y : 0
  const left = clamp(x, 0, Math.max(0, pageWidth - 1))
  const top = clamp(y, 0, Math.max(0, pageHeight - 1))
  const width = normalizePositiveSize(text.width)
  const height = normalizePositiveSize(text.height)
  const radians = (getSafeAngle(text.rotate, 180) * Math.PI) / 180
  const cosine = Math.cos(radians)
  const sine = Math.sin(radians)
  const clampPoint = ({ x: pointX, y: pointY }) => ({
    x: clamp(pointX, 0, pageWidth),
    y: clamp(pointY, 0, pageHeight)
  })
  const topLeft = { x: left, y: top }
  const topRight = {
    x: left + width * cosine,
    y: top + width * sine
  }
  const bottomLeft = {
    x: left - height * sine,
    y: top + height * cosine
  }
  const bottomRight = {
    x: topRight.x - height * sine,
    y: topRight.y + height * cosine
  }

  return {
    topLeft: clampPoint(topLeft),
    topRight: clampPoint(topRight),
    bottomRight: clampPoint(bottomRight),
    bottomLeft: clampPoint(bottomLeft)
  }
}

const strokeOverlayPolygon = (context, polygon) => {
  context.beginPath()
  context.moveTo(polygon.topLeft.x, polygon.topLeft.y)
  context.lineTo(polygon.topRight.x, polygon.topRight.y)
  context.lineTo(polygon.bottomRight.x, polygon.bottomRight.y)
  context.lineTo(polygon.bottomLeft.x, polygon.bottomLeft.y)
  context.closePath()
  context.stroke()
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
  context.fillStyle = 'rgba(255, 59, 48, 0.88)'
  context.lineWidth = getPreviewLineWidth(page.width, page.height)
  context.font = `${Math.max(12, context.lineWidth * 10)}px sans-serif`

  for (const text of page.texts) {
    const polygon = getOverlayPolygon(text, page.width, page.height)

    context.save()
    strokeOverlayPolygon(context, polygon)

    const styleLabel = formatOverlayStyleLabel(text)
    if (styleLabel) {
      context.fillText(styleLabel, polygon.topLeft.x, polygon.topLeft.y - 4)
    }

    context.restore()
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
  setSummary('正在执行单次 OCR 并生成中间态文档；首次运行可能需要等待模型加载。')
  setOutput(rawOutput, 'Working...')
  setOutput(documentOutput, 'Working...')
  resetResultPanels('Rendering overlay preview...', 'No decode result yet.')

  try {
    globalThis.__IMAGE_PARSER_PADDLE_OCR__ = await loadDemoPaddleOcrModule()
    const ImageParser = await loadImageParser()
    const inspection = await ImageParser.inspect(image)
    const document = await ImageParser.encode(image)
    const documentSnapshot = await createDocumentSnapshot(document)
    const recognizedTexts = extractRecognizedTexts(documentSnapshot.value)
    const styledTextCount = countStyledTexts(
      documentSnapshot.value.pages.flatMap((page) => page.texts)
    )

    latestDocument = documentSnapshot.parsed
    await renderOverlayPreview(documentSnapshot.parsed)
    resetDecodeResult('Click Decode to render the exported image.')
    setDecodeEnabled(true)
    setSummary(
      documentSnapshot.emptyResult
        ? 'OCR 成功，但未识别到文字；下方预览与 Decode 将基于右侧中间文档展示。'
        : `OCR 成功；为避免重复推理，左侧不再额外运行一次原始 OCR，下方预览与 Decode 均基于右侧中间文档。检测到 ${styledTextCount} 个带样式线索的文本块。`
    )
    setOutput(rawOutput, {
      inspection,
      note: '已跳过额外原始 OCR 推理，以避免同一张图片执行两次识别导致页面卡顿。',
      pageCount: documentSnapshot.value.pages.length,
      recognizedTexts,
      styledTextCount,
      textCount: documentSnapshot.textCount
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
  setSummary('正在基于右侧中间文档调用 ImageParser.decode() 导出解码图片。')
  resetDecodeResult('Decoding...')

  try {
    const ImageParser = await loadImageParser()
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
