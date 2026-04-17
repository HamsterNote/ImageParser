import { dts } from 'rolldown-plugin-dts'

export default {
  input: './src/index.ts',
  plugins: [dts()],
  external: [
    '@hamster-note/types',
    '@hamster-note/document-parser',
    '@paddlejs-models/ocr'
  ],
  output: [{ dir: 'dist', format: 'es', sourcemap: true }]
}
