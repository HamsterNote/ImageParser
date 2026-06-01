import { PaddleOCR } from './vendor/paddleocr-browser.js'

const OCR_WORKER_ENTRY_PATH = new URL(
  '../dist/assets/worker-entry-Dtffs1su.js',
  import.meta.url
)
const ORT_WASM_PATH = new URL(
  '../dist/',
  import.meta.url
).href

const createOcrWorker = () => {
  console.log('[PaddleOCR] 创建 Worker:', OCR_WORKER_ENTRY_PATH.href)
  console.log('[PaddleOCR] Worker 类型: module')

  try {
    const worker = new Worker(OCR_WORKER_ENTRY_PATH, { type: 'module' })
    console.log('[PaddleOCR] Worker 创建成功')

    worker.onerror = (event) => {
      console.error('[PaddleOCR] Worker 错误:', event)
      console.error('[PaddleOCR] Worker 错误消息:', event.message)
      console.error('[PaddleOCR] Worker 错误文件:', event.filename)
      console.error('[PaddleOCR] Worker 错误行号:', event.lineno)
    }

    return worker
  } catch (error) {
    console.error('[PaddleOCR] Worker 创建失败:', error)
    throw error
  }
}

const demoPaddleOcrOptions = {
  worker: {
    createWorker: createOcrWorker
  },
  unsupportedBehavior: 'error',
  lang: 'ch',
  ocrVersion: 'PP-OCRv5',
  ortOptions: {
    backend: 'wasm',
    wasmPaths: ORT_WASM_PATH,
    disableWasmProxy: true,
    numThreads: 1,
    proxy: false,
    simd: false
  }
}

let paddleOcrPromise

export const create = async () => {
  if (!paddleOcrPromise) {
    console.log('[PaddleOCR] 开始初始化 OCR 实例...')
    console.log('[PaddleOCR] 配置:', {
      lang: demoPaddleOcrOptions.lang,
      ocrVersion: demoPaddleOcrOptions.ocrVersion,
      backend: demoPaddleOcrOptions.ortOptions?.backend,
      numThreads: demoPaddleOcrOptions.ortOptions?.numThreads,
      simd: demoPaddleOcrOptions.ortOptions?.simd
    })

    paddleOcrPromise = PaddleOCR.create(demoPaddleOcrOptions)
      .then((instance) => {
        console.log('[PaddleOCR] OCR 实例创建成功')
        return instance
      })
      .catch((error) => {
        console.error('[PaddleOCR] OCR 实例创建失败:', error)
        console.error('[PaddleOCR] 错误类型:', error?.constructor?.name)
        console.error('[PaddleOCR] 错误消息:', error?.message)
        paddleOcrPromise = undefined
        throw error
      })
  } else {
    console.log('[PaddleOCR] 复用已有的 OCR 实例')
  }

  return paddleOcrPromise
}

export { PaddleOCR }
export * from './vendor/paddleocr-browser.js'

export const createDemoPaddleOcr = async () => {
  return create()
}

export const predict = async (...args) => {
  console.log('[PaddleOCR] 开始执行 predict()...')
  console.log('[PaddleOCR] 输入参数数量:', args.length)

  const ocr = await createDemoPaddleOcr()

  try {
    const result = await ocr.predict(...args)
    console.log('[PaddleOCR] predict() 完成')
    console.log('[PaddleOCR] 结果类型:', typeof result)
    console.log('[PaddleOCR] 结果长度:', Array.isArray(result) ? result.length : '非数组')

    if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0]
      console.log('[PaddleOCR] 第一个结果:', {
        hasItems: !!firstResult?.items,
        itemCount: firstResult?.items?.length ?? 0
      })
    }

    return result
  } catch (error) {
    console.error('[PaddleOCR] predict() 失败:', error)
    throw error
  }
}

export const dispose = async () => {
  const currentPromise = paddleOcrPromise
  paddleOcrPromise = undefined

  if (!currentPromise) return

  try {
    const ocr = await currentPromise
    await ocr.dispose()
  } catch {
    // ignore disposal errors in demo helper
  }
}

export default {
  PaddleOCR,
  create,
  createDemoPaddleOcr,
  dispose,
  predict
}
