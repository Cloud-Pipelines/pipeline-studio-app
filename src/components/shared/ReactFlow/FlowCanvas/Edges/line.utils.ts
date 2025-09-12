// Type definitions
export interface Point {
  x: number;
  y: number;
}

export interface LineSegment {
  type: "line";
  start: Point;
  end: Point;
}

export interface QuadraticSegment {
  type: "quadratic";
  start: Point;
  control: Point;
  end: Point;
}

export interface CubicSegment {
  type: "cubic";
  start: Point;
  control1: Point;
  control2: Point;
  end: Point;
}

export type PathSegment = LineSegment | QuadraticSegment | CubicSegment;

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Check intersection between two lines described as SVG Path String
 * @param lineA - First SVG path string
 * @param lineB - Second SVG path string
 * @returns Array of intersection points
 */
export function checkIntersection(lineA: string, lineB: string): Point[] {
  // Parse paths into segments
  const segmentsA = parsePath(lineA);
  const segmentsB = parsePath(lineB);

  const intersections: Point[] = [];

  // Check all segment pairs for intersections
  for (const segA of segmentsA) {
    for (const segB of segmentsB) {
      const points = getSegmentIntersection(segA, segB);
      intersections.push(...points);
    }
  }

  // Remove duplicates (with tolerance)
  return removeDuplicatePoints(intersections);
}

/**
 * Parse SVG path string into segments
 */
function parsePath(pathString: string): PathSegment[] {
  const segments: PathSegment[] = [];
  const commands =
    pathString.match(/[MLQCHVZmlqchvz][^MLQCHVZmlqchvz]*/g) || [];

  let currentPoint: Point = { x: 0, y: 0 };
  let startPoint: Point = { x: 0, y: 0 };

  for (const command of commands) {
    const type = command[0];
    const coords = command
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number);

    switch (type.toUpperCase()) {
      case "M": // Move to
        currentPoint = { x: coords[0], y: coords[1] };
        startPoint = { ...currentPoint };
        break;

      case "L": // Line to
        segments.push({
          type: "line",
          start: { ...currentPoint },
          end: { x: coords[0], y: coords[1] },
        } as LineSegment);
        currentPoint = { x: coords[0], y: coords[1] };
        break;

      case "Q": // Quadratic Bézier curve
        for (let i = 0; i < coords.length; i += 4) {
          segments.push({
            type: "quadratic",
            start: { ...currentPoint },
            control: { x: coords[i], y: coords[i + 1] },
            end: { x: coords[i + 2], y: coords[i + 3] },
          } as QuadraticSegment);
          currentPoint = { x: coords[i + 2], y: coords[i + 3] };
        }
        break;

      case "C": // Cubic Bézier curve
        for (let i = 0; i < coords.length; i += 6) {
          segments.push({
            type: "cubic",
            start: { ...currentPoint },
            control1: { x: coords[i], y: coords[i + 1] },
            control2: { x: coords[i + 2], y: coords[i + 3] },
            end: { x: coords[i + 4], y: coords[i + 5] },
          } as CubicSegment);
          currentPoint = { x: coords[i + 4], y: coords[i + 5] };
        }
        break;

      case "Z": // Close path
        if (
          currentPoint.x !== startPoint.x ||
          currentPoint.y !== startPoint.y
        ) {
          segments.push({
            type: "line",
            start: { ...currentPoint },
            end: { ...startPoint },
          } as LineSegment);
          currentPoint = { ...startPoint };
        }
        break;
    }
  }

  return segments;
}

/**
 * Get intersection points between two segments
 */
function getSegmentIntersection(segA: PathSegment, segB: PathSegment): Point[] {
  if (segA.type === "line" && segB.type === "line") {
    return lineLineIntersection(segA, segB);
  } else if (segA.type === "line" && segB.type === "quadratic") {
    return lineQuadraticIntersection(segA, segB);
  } else if (segA.type === "quadratic" && segB.type === "line") {
    return lineQuadraticIntersection(segB, segA);
  } else if (segA.type === "quadratic" && segB.type === "quadratic") {
    return quadraticQuadraticIntersection(segA, segB);
  }
  // Add more cases for cubic curves if needed
  return [];
}

/**
 * Find intersection between two line segments
 */
function lineLineIntersection(lineA: LineSegment, lineB: LineSegment): Point[] {
  const x1 = lineA.start.x,
    y1 = lineA.start.y;
  const x2 = lineA.end.x,
    y2 = lineA.end.y;
  const x3 = lineB.start.x,
    y3 = lineB.start.y;
  const x4 = lineB.end.x,
    y4 = lineB.end.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (Math.abs(denom) < 1e-10) return []; // Parallel lines

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return [
      {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1),
      },
    ];
  }

  return [];
}

/**
 * Find intersection between line and quadratic Bézier curve
 */
function lineQuadraticIntersection(
  line: LineSegment,
  quad: QuadraticSegment,
): Point[] {
  const intersections: Point[] = [];

  // Parametric form of line: P = A + t * (B - A)
  const A = line.start;
  const B = line.end;

  // Parametric form of quadratic: Q(s) = (1-s)²P0 + 2(1-s)s*P1 + s²P2
  const P0 = quad.start;
  const P1 = quad.control;
  const P2 = quad.end;

  // Convert to implicit form and solve
  // This results in a quadratic equation in s
  const a = P0.x - 2 * P1.x + P2.x;
  const b = 2 * (P1.x - P0.x);
  const c = P0.x;

  const d = P0.y - 2 * P1.y + P2.y;
  const e = 2 * (P1.y - P0.y);
  const f = P0.y;

  const dx = B.x - A.x;
  const dy = B.y - A.y;

  // Solve for parameter s on the quadratic curve
  const A_coeff = dx * d - dy * a;
  const B_coeff = dx * e - dy * b;
  const C_coeff = dx * (f - A.y) - dy * (c - A.x);

  if (Math.abs(A_coeff) < 1e-10) {
    // Linear case
    if (Math.abs(B_coeff) > 1e-10) {
      const s = -C_coeff / B_coeff;
      if (s >= 0 && s <= 1) {
        const point = evaluateQuadraticBezier(quad, s);
        const t = getLineParameter(line, point);
        if (t >= 0 && t <= 1) {
          intersections.push(point);
        }
      }
    }
  } else {
    // Quadratic case
    const discriminant = B_coeff * B_coeff - 4 * A_coeff * C_coeff;
    if (discriminant >= 0) {
      const sqrt_disc = Math.sqrt(discriminant);
      const s1 = (-B_coeff + sqrt_disc) / (2 * A_coeff);
      const s2 = (-B_coeff - sqrt_disc) / (2 * A_coeff);

      for (const s of [s1, s2]) {
        if (s >= 0 && s <= 1) {
          const point = evaluateQuadraticBezier(quad, s);
          const t = getLineParameter(line, point);
          if (t >= 0 && t <= 1) {
            intersections.push(point);
          }
        }
      }
    }
  }

  return intersections;
}

/**
 * Find intersection between two quadratic Bézier curves
 * Using subdivision and approximation method
 */
function quadraticQuadraticIntersection(
  quadA: QuadraticSegment,
  quadB: QuadraticSegment,
  depth: number = 0,
  maxDepth: number = 10,
  tolerance: number = 0.1,
): Point[] {
  const intersections: Point[] = [];

  // Get bounding boxes
  const boxA = getBoundingBox(quadA);
  const boxB = getBoundingBox(quadB);

  // Check if bounding boxes intersect
  if (!boxesIntersect(boxA, boxB)) {
    return [];
  }

  // If curves are small enough, approximate with lines
  if (
    depth >= maxDepth ||
    (getCurveLength(quadA) < tolerance && getCurveLength(quadB) < tolerance)
  ) {
    // Approximate with line segments and find intersection
    const lineA: LineSegment = {
      type: "line",
      start: quadA.start,
      end: quadA.end,
    };
    const lineB: LineSegment = {
      type: "line",
      start: quadB.start,
      end: quadB.end,
    };
    return lineLineIntersection(lineA, lineB);
  }

  // Subdivide curves and recursively check
  const [quadA1, quadA2] = subdivideQuadratic(quadA, 0.5);
  const [quadB1, quadB2] = subdivideQuadratic(quadB, 0.5);

  intersections.push(
    ...quadraticQuadraticIntersection(
      quadA1,
      quadB1,
      depth + 1,
      maxDepth,
      tolerance,
    ),
    ...quadraticQuadraticIntersection(
      quadA1,
      quadB2,
      depth + 1,
      maxDepth,
      tolerance,
    ),
    ...quadraticQuadraticIntersection(
      quadA2,
      quadB1,
      depth + 1,
      maxDepth,
      tolerance,
    ),
    ...quadraticQuadraticIntersection(
      quadA2,
      quadB2,
      depth + 1,
      maxDepth,
      tolerance,
    ),
  );

  return removeDuplicatePoints(intersections);
}

/**
 * Evaluate quadratic Bézier curve at parameter t
 */
function evaluateQuadraticBezier(quad: QuadraticSegment, t: number): Point {
  const s = 1 - t;
  return {
    x: s * s * quad.start.x + 2 * s * t * quad.control.x + t * t * quad.end.x,
    y: s * s * quad.start.y + 2 * s * t * quad.control.y + t * t * quad.end.y,
  };
}

/**
 * Get line parameter for a point
 */
function getLineParameter(line: LineSegment, point: Point): number {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return (point.x - line.start.x) / dx;
  } else {
    return (point.y - line.start.y) / dy;
  }
}

/**
 * Subdivide quadratic Bézier curve at parameter t
 */
function subdivideQuadratic(
  quad: QuadraticSegment,
  t: number,
): [QuadraticSegment, QuadraticSegment] {
  const s = 1 - t;

  const mid1: Point = {
    x: s * quad.start.x + t * quad.control.x,
    y: s * quad.start.y + t * quad.control.y,
  };

  const mid2: Point = {
    x: s * quad.control.x + t * quad.end.x,
    y: s * quad.control.y + t * quad.end.y,
  };

  const midPoint: Point = {
    x: s * mid1.x + t * mid2.x,
    y: s * mid1.y + t * mid2.y,
  };

  return [
    {
      type: "quadratic",
      start: quad.start,
      control: mid1,
      end: midPoint,
    },
    {
      type: "quadratic",
      start: midPoint,
      control: mid2,
      end: quad.end,
    },
  ];
}

/**
 * Get bounding box for a quadratic curve
 */
function getBoundingBox(quad: QuadraticSegment): BoundingBox {
  const points = [quad.start, quad.control, quad.end];

  return {
    minX: Math.min(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxX: Math.max(...points.map((p) => p.x)),
    maxY: Math.max(...points.map((p) => p.y)),
  };
}

/**
 * Check if two bounding boxes intersect
 */
function boxesIntersect(boxA: BoundingBox, boxB: BoundingBox): boolean {
  return !(
    boxA.maxX < boxB.minX ||
    boxB.maxX < boxA.minX ||
    boxA.maxY < boxB.minY ||
    boxB.maxY < boxA.minY
  );
}

/**
 * Get approximate length of quadratic curve
 */
function getCurveLength(quad: QuadraticSegment): number {
  const dx1 = quad.control.x - quad.start.x;
  const dy1 = quad.control.y - quad.start.y;
  const dx2 = quad.end.x - quad.control.x;
  const dy2 = quad.end.y - quad.control.y;

  return Math.sqrt(dx1 * dx1 + dy1 * dy1) + Math.sqrt(dx2 * dx2 + dy2 * dy2);
}

/**
 * Remove duplicate points within tolerance
 */
export function removeDuplicatePoints(
  points: Point[],
  tolerance: number = 1e-6,
): Point[] {
  const unique: Point[] = [];

  for (const point of points) {
    const isDuplicate = unique.some(
      (p) =>
        Math.abs(p.x - point.x) < tolerance &&
        Math.abs(p.y - point.y) < tolerance,
    );

    if (!isDuplicate) {
      unique.push(point);
    }
  }

  return unique;
}
