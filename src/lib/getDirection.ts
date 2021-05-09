const modulo = (a: number, n: number) => ((a % n) + n) % n
const { PI } = Math

export enum Direction {
  Up = "UP",
  Right = "RIGHT",
  Down = "DOWN",
  Left = "LEFT",
}

export function getDirection (angle: number): Direction {
  const simplifiedAngle = modulo(angle, PI * 2)
  // TODO: the angles are messed up, figure out why.
  return (
    simplifiedAngle < PI * 0.25 ? Direction.Right :
    simplifiedAngle < PI * 0.75 ? Direction.Down :
    simplifiedAngle < PI * 1.25 ? Direction.Left :
    simplifiedAngle < PI * 1.75 ? Direction.Up :
    Direction.Right
  )
}