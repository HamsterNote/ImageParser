const getPaddleOcr = () => {
  const ocr = globalThis.paddlejs?.ocr

  if (!ocr) {
    throw new Error('PaddleJS OCR runtime is not loaded.')
  }

  return ocr
}

export const init = (...args) => getPaddleOcr().init(...args)

export const recognize = (...args) => getPaddleOcr().recognize(...args)

export const detect = (...args) => getPaddleOcr().detect(...args)

export default {
  detect,
  init,
  recognize
}
