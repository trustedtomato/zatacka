
export interface AngleBasedVector {
  angle: number
  length: number
}

export class CoordinateVector {
  x: number
  y: number
}

export const angleBasedVectorToCoordinateVector = (angleBasedVector: AngleBasedVector): CoordinateVector => ({
  x: Math.cos(angleBasedVector.angle) * angleBasedVector.length,
  y: Math.sin(angleBasedVector.angle) * angleBasedVector.length
})

export const addTwoCoordinateVectors = (a: CoordinateVector, b: CoordinateVector): CoordinateVector => ({
  x: a.x + b.x,
  y: a.y + b.y
})

/** Subtract b from a. */
export const coordinateVectorSubtract = (a: CoordinateVector, b: CoordinateVector): CoordinateVector => ({
  x: a.x - b.x,
  y: a.y - b.y
})