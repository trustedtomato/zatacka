import intersect from 'robust-segment-intersect'
import type { CoordinateVector } from './Vector'
const { min, max } = Math

export type LineSegment = [CoordinateVector, CoordinateVector]

function doLineSegmentBoundingBoxesIntersect (ls1: LineSegment, ls2: LineSegment) {
  const xMin1 = min(ls1[0].x, ls1[1].x)
  const xMax1 = max(ls1[0].x, ls1[1].x)
  const xMin2 = min(ls2[0].x, ls1[1].x)
  const xMax2 = max(ls2[0].x, ls1[1].x)
  const yMin1 = min(ls1[0].y, ls1[1].y)
  const yMax1 = max(ls1[0].y, ls1[1].y)
  const yMin2 = min(ls2[0].y, ls1[1].y)
  const yMax2 = max(ls2[0].y, ls1[1].y)
  return (
    xMax1 >= xMin2 &&
    xMax2 >= xMin1 &&
    yMax1 >= yMin2 &&
    yMax2 >= yMin1
  )
}

export function doLineSegmentsIntersect (
  ls1: LineSegment,
  ls2: LineSegment
): boolean {
  return (
    // First check if bounding boxes intersect for better performance.
    doLineSegmentBoundingBoxesIntersect(ls1, ls2) &&
    intersect(
      [ls1[0].x, ls1[0].y],
      [ls1[1].x, ls1[1].y],
      [ls2[0].x, ls2[0].y],
      [ls2[1].x, ls2[1].y],
    )
  )
}

/*
import { coordinateVectorSubtract } from './Vector'
import type { CoordinateVector } from './Vector'
export type LineSegment = [CoordinateVector, CoordinateVector]

function crossProduct (p1: CoordinateVector, p2: CoordinateVector) {
  return p1.x * p2.y - p2.x * p1.y
}

const enum PointRelationToLineSegment {
  OnTheLeft,
  OnTheRight,
  OnTheLineSegment
}

const EPSILON = 0.00001

export function getPointRelationToLineSegment (
  p: CoordinateVector,
  ls: LineSegment
): PointRelationToLineSegment {
  // Translate line segment and point so that
  // the start of the line segment is on the origin.
  const movedSegmentEnd = coordinateVectorSubtract(ls[1], ls[0])
  const movedPoint = coordinateVectorSubtract(p, ls[0])
  const cp = crossProduct(movedSegmentEnd, movedPoint)
  return (
    cp < -EPSILON ? PointRelationToLineSegment.OnTheLeft :
    cp > EPSILON ? PointRelationToLineSegment.OnTheRight :
    PointRelationToLineSegment.OnTheLineSegment
  )
}

export function doLineSegmentAndLineIntersect (
  ls: LineSegment,
  l: LineSegment
): boolean {
  const ls0RelationToLs = getPointRelationToLineSegment(ls[0], l)
  const ls1RelationToLs = getPointRelationToLineSegment(ls[1], l)
  console.log(ls0RelationToLs, ls1RelationToLs)
  return (
    ls0RelationToLs === PointRelationToLineSegment.OnTheLineSegment ||
    ls1RelationToLs === PointRelationToLineSegment.OnTheLineSegment ||
    (ls0RelationToLs === PointRelationToLineSegment.OnTheLeft && ls1RelationToLs === PointRelationToLineSegment.OnTheRight) ||
    (ls0RelationToLs === PointRelationToLineSegment.OnTheRight && ls1RelationToLs === PointRelationToLineSegment.OnTheLeft)
  )
}

export function doLineSegmentBoundingBoxesIntersect (
  ls1: LineSegment,
  ls2: LineSegment
): boolean {
  return ls1[0].x <= ls2[1].x
      && ls1[1].x >= ls2[0].x
      && ls1[0].y <= ls2[1].y
      && ls1[1].y >= ls2[0].y
}

export function doLineSegmentsIntersect (
  ls1: LineSegment,
  ls2: LineSegment
): boolean {
  return (
    // doLineSegmentBoundingBoxesIntersect(ls1, ls2) &&
    doLineSegmentAndLineIntersect(ls1, ls2) &&
    doLineSegmentAndLineIntersect(ls2, ls1)
  )
}
*/