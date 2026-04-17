const OPENCV_SCRIPT_PATH = '/node_modules/@techstark/opencv-js/dist/opencv.js'

let runtimeReadyPromise
let runtimeInitializedHandler

const cvModule = {}

function resolveInitializedRuntime(loadedCv) {
  Object.assign(cvModule, loadedCv)
  runtimeInitializedHandler?.()
}

function loadOpenCvRuntime() {
  if (runtimeReadyPromise) return runtimeReadyPromise

  runtimeReadyPromise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('OpenCV browser shim requires document to load script.'))
      return
    }

    const finish = (loadedCv) => {
      resolveInitializedRuntime(loadedCv)
      resolve(loadedCv)
    }

    const consumeGlobalCv = () => {
      const loadedCv = globalThis.cv
      if (!loadedCv) {
        reject(new Error('OpenCV.js runtime is unavailable after script load.'))
        return
      }

      if (typeof loadedCv.then === 'function') {
        loadedCv.then(finish).catch(reject)
        return
      }

      finish(loadedCv)
    }

    const existingScript = document.querySelector('script[data-opencv-shim="true"]')
    if (existingScript instanceof HTMLScriptElement) {
      if (globalThis.cv) {
        consumeGlobalCv()
        return
      }

      existingScript.addEventListener('load', consumeGlobalCv, { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load OpenCV.js runtime.')),
        { once: true }
      )
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.dataset.opencvShim = 'true'
    script.src = OPENCV_SCRIPT_PATH
    script.addEventListener('load', consumeGlobalCv, { once: true })
    script.addEventListener(
      'error',
      () => reject(new Error('Failed to load OpenCV.js runtime.')),
      { once: true }
    )
    document.head.append(script)
  }).catch((error) => {
    runtimeReadyPromise = undefined
    throw error
  })

  return runtimeReadyPromise
}

Object.defineProperty(cvModule, 'onRuntimeInitialized', {
  configurable: true,
  enumerable: true,
  get() {
    return runtimeInitializedHandler
  },
  set(handler) {
    runtimeInitializedHandler = typeof handler === 'function' ? handler : undefined
    void loadOpenCvRuntime()
  }
})

if (globalThis.cv && typeof globalThis.cv.then !== 'function') {
  resolveInitializedRuntime(globalThis.cv)
}

export default cvModule
