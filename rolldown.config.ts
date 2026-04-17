import { dts } from 'rolldown-plugin-dts'

const opencvBrowserShimPath =
  '/Users/zhangxiao/frontend/HamsterNote/ImageParser/demo/opencv-browser-shim.js'

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
