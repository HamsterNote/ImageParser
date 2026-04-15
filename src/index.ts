import { DocumentParser, type ParserInput } from '@hamster-note/document-parser'
import {
  IntermediateDocument,
  IntermediatePage,
  IntermediatePageMap,
  IntermediateText,
  TextDir
} from '@hamster-note/types'

export type ImageParserInputKind =
  | 'array-buffer'
  | 'array-buffer-view'
  | 'blob'

export interface ImageParserInspection {
  byteLength: number
  kind: ImageParserInputKind
  message: string
  mimeType?: string
  status: 'placeholder'
  supportedExtensions: readonly string[]
}

export interface CreatePlaceholderImageDocumentOptions {
  inspection: ImageParserInspection
  title?: string
}

function detectInputKind(input: ParserInput): ImageParserInputKind {
  if (input instanceof Blob) return 'blob'
  if (ArrayBuffer.isView(input)) return 'array-buffer-view'
  return 'array-buffer'
}

function derivePlaceholderTitle(inspection: ImageParserInspection): string {
  const sourceLabel = inspection.mimeType ?? inspection.kind
  return `Placeholder Image Document (${sourceLabel})`
}

function createPlaceholderText(
  inspection: ImageParserInspection
): IntermediateText {
  return new IntermediateText({
    id: 'image-parser-placeholder-text-1',
    content: `ImageParser placeholder (${inspection.byteLength} bytes)`,
    fontSize: 16,
    fontFamily: 'sans-serif',
    fontWeight: 400,
    italic: false,
    color: '#0f172a',
    width: 420,
    height: 24,
    lineHeight: 24,
    x: 24,
    y: 24,
    ascent: 18,
    descent: 6,
    dir: TextDir.LTR,
    rotate: 0,
    skew: 0,
    isEOL: true
  })
}

export function createPlaceholderImageDocument(
  options: CreatePlaceholderImageDocumentOptions
): IntermediateDocument {
  const page = new IntermediatePage({
    id: 'image-parser-placeholder-page-1',
    texts: [createPlaceholderText(options.inspection)],
    width: 640,
    height: 360,
    number: 1,
    thumbnail: undefined
  })

  const pagesMap = IntermediatePageMap.fromInfoList([
    {
      id: page.id,
      pageNumber: page.number,
      size: {
        x: page.width,
        y: page.height
      },
      getData: async () => page
    }
  ])

  return new IntermediateDocument({
    id: 'image-parser-placeholder-document',
    title: options.title ?? derivePlaceholderTitle(options.inspection),
    pagesMap,
    outline: undefined
  })
}

export class ImageParser extends DocumentParser {
  static readonly exts = [
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
    'bmp',
    'svg'
  ] as const

  static readonly ext = 'png'

  static async inspect(input: ParserInput): Promise<ImageParserInspection> {
    const bytes = await ImageParser.toUint8Array(input)
    const mimeType = input instanceof Blob && input.type ? input.type : undefined

    return {
      byteLength: bytes.byteLength,
      kind: detectInputKind(input),
      message:
        'ImageParser 当前提供工程初始化占位实现，尚未执行真实图片解析。',
      mimeType,
      status: 'placeholder',
      supportedExtensions: [...ImageParser.exts]
    }
  }

  static async encode(input: ParserInput): Promise<IntermediateDocument> {
    const inspection = await ImageParser.inspect(input)
    return createPlaceholderImageDocument({ inspection })
  }

  async encode(input: ParserInput): Promise<IntermediateDocument> {
    return ImageParser.encode(input)
  }

  async decode(_intermediateDocument: IntermediateDocument): Promise<ParserInput> {
    throw new Error(
      'ImageParser.decode 尚未实现；当前初始化阶段仅提供占位 inspect/encode 能力。'
    )
  }
}

export async function inspectImage(
  input: ParserInput
): Promise<ImageParserInspection> {
  return ImageParser.inspect(input)
}
