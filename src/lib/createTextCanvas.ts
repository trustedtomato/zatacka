interface CreateTextCanvasConfig {
  text: string
  color: string
  font: string
}

export function createTextCanvas ({ text, color, font }: CreateTextCanvasConfig): HTMLCanvasElement {
  // Get how wide and high the canvas should be.
  const domElement = document.createElement('span')
  domElement.style.font = font
  domElement.appendChild(document.createTextNode(text))
  document.body.appendChild(domElement)
  const {
    width: minWidth,
    height: minHeight
  } = domElement.getBoundingClientRect()
  document.body.removeChild(domElement)

  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(minWidth)
  canvas.height = Math.ceil(minHeight)
  const ctx = canvas.getContext('2d')
  console.log(color, font)
  ctx.fillStyle = color
  ctx.font = font
  ctx.textBaseline = 'top'
  ctx.fillText(text, 0, 0)

  return canvas
}