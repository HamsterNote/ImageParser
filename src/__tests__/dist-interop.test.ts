import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const distEntry = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../dist/index.js'
)

const describeIfBuilt = existsSync(distEntry) ? describe : describe.skip

describeIfBuilt('dist 产物互操作', () => {
  it('encode 返回的文档与外部类型保持一致', async () => {
    const [{ ImageParser }, { IntermediateDocument }] = await Promise.all([
      import(pathToFileURL(distEntry).href),
      import('@hamster-note/types')
    ])

    const document = await ImageParser.encode(Uint8Array.from([1, 2, 3, 4]))

    expect(document).toBeInstanceOf(IntermediateDocument)
  })
})
