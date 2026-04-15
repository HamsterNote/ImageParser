import { ImageParser } from '../dist/index.js'

const SAMPLE_BYTES = Uint8Array.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82
])

const inspectButton = document.querySelector('[data-action="inspect"]')
const output = document.querySelector('[data-role="output"]')
const status = document.querySelector('[data-role="status"]')

const setStatus = (text) => {
  if (status) {
    status.textContent = text
  }
}

const handleInspect = async () => {
  if (!output) return

  setStatus('Inspecting...')
  output.textContent = 'Working...'

  try {
    const blob = new Blob([SAMPLE_BYTES], { type: 'image/png' })
    const inspection = await ImageParser.inspect(blob)
    const document = await ImageParser.encode(blob)
    const pages = await document.pages
    const texts = await pages[0]?.getTexts()

    output.textContent = JSON.stringify(
      {
        inspection,
        placeholderDocument: {
          title: document.title,
          pageCount: document.pageCount,
          firstPageText: texts?.[0]?.content ?? null
        }
      },
      null,
      2
    )
    setStatus('Done')
  } catch (error) {
    output.textContent =
      error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error)
    setStatus('Failed')
  }
}

if (inspectButton) {
  inspectButton.addEventListener('click', () => {
    void handleInspect()
  })
}
