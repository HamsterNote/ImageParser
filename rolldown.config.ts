import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dts } from 'rolldown-plugin-dts'

const configFilePath = fileURLToPath(import.meta.url)
const opencvBrowserShimPath = resolve(
  configFilePath,
  '../demo/opencv-browser-shim.js'
)

export default [
  {
    input: './src/index.ts',
    plugins: [dts()],
    external: [
      '@hamster-note/types',
      '@hamster-note/document-parser',
      '@paddleocr/paddleocr-js'
    ],
    output: [{ dir: 'dist', format: 'es', sourcemap: true }]
  },
  {
    input: './demo/paddleocr-browser-entry.js',
    resolve: {
      alias: {
        '@techstark/opencv-js': opencvBrowserShimPath
      }
    },
    output: [
      {
        dir: './demo/vendor',
        entryFileNames: 'paddleocr-browser.js',
        format: 'es',
        sourcemap: true
      }
    ]
  }
]
