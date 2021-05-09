export const waitForEvent = (eventTarget: EventTarget, type: string): Promise<Event> =>
  new Promise(resolve => {
    const listener = (event: Event) => {
      resolve(event)
      eventTarget.removeEventListener(type, listener)
    }
    eventTarget.addEventListener(type, listener)
  })