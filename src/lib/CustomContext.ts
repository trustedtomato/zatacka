export class CustomContext {
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private buffer: Uint8Array
  private isCleared = true
  readonly alpha: boolean
  constructor (public canvas: HTMLCanvasElement, { alpha }: { alpha?: boolean } = {}) {
    this.alpha = alpha ?? true
    this.ctx = canvas.getContext('2d', { alpha })
    this.width = Math.floor(canvas.width)
    this.height = Math.floor(canvas.height)
    this.buffer = new Uint8Array(this.width * this.height)
    if (!this.alpha) {
      this.ctx.fillStyle = 'black'
      this.ctx.fillRect(0, 0, this.width, this.height)
    }
  }
  clear (): void {
    if (this.isCleared) {
      return
    }
    this.isCleared = true
    if (this.alpha) {
      this.ctx.clearRect(0, 0, this.width, this.height)
    } else {
      // clearRect works weirdly in Chrome 89 with { alpha: false }
      this.ctx.fillStyle = 'black'
      this.ctx.fillRect(0, 0, this.width, this.height)
    }
    this.buffer.fill(0)
  }
  set fillStyle (style: string) {
    this.ctx.fillStyle = style
  }
  fillRect (x: number, y: number, w: number, h: number): void {
    this.isCleared = false
    this.ctx.fillRect(x, y, w, h)
    for (let iX = x; iX < x + w; iX++) {
      for (let iY = y; iY < y + h; iY++) {
        this.buffer[iY * this.width + iX] = 1
      }
    }
  }
  isPointFilled (x: number, y: number): boolean {
    return this.buffer[y * this.width + x] !== 0
  }
}