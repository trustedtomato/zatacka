export function waitForAnimationFrame (): Promise<number> {
  return new Promise(resolve => {
    requestAnimationFrame(resolve)
  })
}