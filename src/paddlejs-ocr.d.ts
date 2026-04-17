declare module '@paddlejs-models/ocr' {
  export interface CanvasStyleOptions {
    strokeStyle?: string
    lineWidth?: number
    fillStyle?: string
  }

  export interface DrawBoxOptions {
    canvas?: HTMLCanvasElement
    style?: CanvasStyleOptions
  }

  export interface DetPostConfig {
    shape: number
    thresh: number
    box_thresh: number
    unclip_ratio: number
  }

  export interface OCRResult {
    text: string[]
    points: unknown
  }

  export function init(
    detCustomModel?: string,
    recCustomModel?: string
  ): Promise<void>

  export function recognize(
    image: HTMLImageElement,
    options?: DrawBoxOptions,
    detConfig?: DetPostConfig
  ): Promise<OCRResult>

  export function detect(image: HTMLImageElement): Promise<unknown>
}
