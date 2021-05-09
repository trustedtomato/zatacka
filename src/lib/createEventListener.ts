export interface EventListener {
  destroy: () => void
} 

export function createEventListener (
  target: EventTarget,
  type: string,
  listener: (event: Event) => boolean | void
): EventListener {
  target.addEventListener(type, listener)
  return {
    destroy () {
      target.removeEventListener(type, listener)
    }
  } 
}
