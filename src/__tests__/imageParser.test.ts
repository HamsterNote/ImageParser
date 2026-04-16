import { ImageParser, type ImageParserInspection, inspectImage } from '../index'

describe('ImageParser', () => {
  it('inspect 应返回类型安全的占位摘要', async () => {
    const blob = new Blob([Uint8Array.from([137, 80, 78, 71])], {
      type: 'image/png'
    })

    const inspection: ImageParserInspection = await inspectImage(blob)

    expect(inspection.status).toBe('placeholder')
    expect(inspection.kind).toBe('blob')
    expect(inspection.mimeType).toBe('image/png')
    expect(inspection.byteLength).toBe(4)
    expect(inspection.supportedExtensions).toContain('png')
  })

  it('encode 应返回可验证的占位文档', async () => {
    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))
    const pages = await document.pages
    const texts = await pages[0].getTexts()

    expect(document.title).toContain('Placeholder Image Document')
    expect(document.pageCount).toBe(1)
    expect(texts[0]?.content).toContain('4 bytes')
  })

  it('decode 应明确提示尚未实现', async () => {
    const parser = new ImageParser()
    const document = await ImageParser.encode(Uint8Array.from([9, 9, 9]))

    await expect(parser.decode(document)).rejects.toThrow('尚未实现')
  })

  it('global Blob 不可用时仍可识别 array-buffer-view', async () => {
    const originalBlob = globalThis.Blob

    Reflect.deleteProperty(globalThis, 'Blob')

    try {
      const inspection = await ImageParser.inspect(Uint8Array.from([1, 2, 3]))

      expect(inspection.kind).toBe('array-buffer-view')
      expect(inspection.status).toBe('placeholder')
    } finally {
      if (originalBlob === undefined) {
        Reflect.deleteProperty(globalThis, 'Blob')
      } else {
        globalThis.Blob = originalBlob
      }
    }
  })
})
