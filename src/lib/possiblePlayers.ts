export interface Player {
  controlKeys: {
    turnAnticlockwise: string
    turnClockwise: string
  }
  color: string,
  name: string,
  isColorLight?: boolean
}

export const possiblePlayers: Player[] = [{
  controlKeys: {
    turnAnticlockwise: 'Backquote',
    turnClockwise: 'Tab'
  },
  color: 'hsl(0, 100%, 50%)',
  name: 'red'
}, {
  controlKeys: {
    turnAnticlockwise: 'ShiftLeft',
    turnClockwise: 'KeyZ'
  },
  color: 'hsl(30, 100%, 50%)',
  name: 'orange',
  isColorLight: true
}, {
  controlKeys: {
    turnAnticlockwise: 'Digit2',
    turnClockwise: 'Digit3'
  },
  color: 'hsl(60, 100%, 50%)',
  name: 'yellow',
  isColorLight: true
}, {
  controlKeys: {
    turnAnticlockwise: 'PageUp',
    turnClockwise: 'PageDown'
  },
  color: 'hsl(90, 100%, 50%)',
  name: 'green',
  isColorLight: true
}, {
  controlKeys: {
    turnAnticlockwise: 'Digit7',
    turnClockwise: 'Digit8'
  },
  color: 'hsl(180, 100%, 50%)',
  name: 'cyan',
  isColorLight: true
}, {
  controlKeys: {
    turnAnticlockwise: 'Minus',
    turnClockwise: 'Equal'
  },
  color: 'hsl(240, 100%, 50%)',
  name: 'blue'
}, {
  controlKeys: {
    turnAnticlockwise: 'KeyC',
    turnClockwise: 'KeyV'
  },
  color: 'hsl(270, 100%, 50%)',
  name: 'purple'
}, {
  controlKeys: {
    turnAnticlockwise: 'Comma',
    turnClockwise: 'Period'
  },
  color: 'hsl(300, 100%, 50%)',
  name: 'magenta',
  isColorLight: true
}, {
  controlKeys: {
    turnAnticlockwise: 'ArrowDown',
    turnClockwise: 'ArrowRight'
  },
  color: 'hsl(330, 100%, 50%)',
  name: 'pink'
}]
