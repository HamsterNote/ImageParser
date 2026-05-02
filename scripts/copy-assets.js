import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const root = dirname(__filename)
const distDir = join(root, '../dist')
const distAssetsDir = join(distDir, 'assets')

async function resolveWorkerEntrySrc() {
  const paddleAssetsDir = join(
    root,
    '../node_modules/@paddleocr/paddleocr-js/dist/assets'
  )

  let entries
  try {
    entries = await readdir(paddleAssetsDir)
  } catch (err) {
    throw new Error(
      `Failed to read PaddleOCR assets directory ${paddleAssetsDir}: ${err.message}`
    )
  }

  const match = entries.find(
    (name) => name.startsWith('worker-entry-') && name.endsWith('.js')
  )

  if (!match) {
    throw new Error(
      `No worker-entry-*.js found in ${paddleAssetsDir}. ` +
        'The @paddleocr/paddleocr-js package may have changed its asset naming.'
    )
  }

  return { src: join(paddleAssetsDir, match), fileName: match }
}

async function main() {
  const workerEntry = await resolveWorkerEntrySrc()

  const assets = [
    {
      src: workerEntry.src,
      dest: join(distAssetsDir, workerEntry.fileName)
    },
    {
      src: join(root, '../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs'),
      dest: join(distDir, 'ort-wasm-simd-threaded.jsep.mjs')
    },
    {
      src: join(root, '../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm'),
      dest: join(distDir, 'ort-wasm-simd-threaded.jsep.wasm')
    }
  ]

  try {
    await readdir(distDir)
  } catch (err) {
    throw new Error(
      `Build output directory ${distDir} does not exist. ` +
        'Ensure rolldown runs before this script (check build:all in package.json).'
    )
  }

  await mkdir(distAssetsDir, { recursive: true })

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
