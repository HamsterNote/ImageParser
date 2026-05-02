import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const root = dirname(__filename)

const assets = [
  {
    src: join(root, '../node_modules/@paddleocr/paddleocr-js/dist/assets/worker-entry-Dtffs1su.js'),
    dest: join(root, '../dist/assets/worker-entry-Dtffs1su.js')
  },
  {
    src: join(root, '../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs'),
    dest: join(root, '../dist/ort-wasm-simd-threaded.jsep.mjs')
  },
  {
    src: join(root, '../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm'),
    dest: join(root, '../dist/ort-wasm-simd-threaded.jsep.wasm')
  }
]

async function main() {
  await mkdir(join(root, '../dist/assets'), { recursive: true })

  for (const { src, dest } of assets) {
    try {
      await copyFile(src, dest)
      console.log(`Copied: ${src} → ${dest}`)
    } catch (err) {
      console.error(`Failed to copy ${src}: ${err.message}`)
      process.exit(1)
    }
  }

  console.log('All assets copied successfully.')
}

main()
