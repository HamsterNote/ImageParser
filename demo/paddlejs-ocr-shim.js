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
  return new Worker(OCR_WORKER_ENTRY_PATH, { type: 'module' })
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
    paddleOcrPromise = PaddleOCR.create(demoPaddleOcrOptions).catch((error) => {
      paddleOcrPromise = undefined
      throw error
    })
  }

  return paddleOcrPromise
}

export { PaddleOCR }
export * from './vendor/paddleocr-browser.js'

export const createDemoPaddleOcr = async () => {
  return create()
}

export const predict = async (...args) => {
  const ocr = await createDemoPaddleOcr()
  return ocr.predict(...args)
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
