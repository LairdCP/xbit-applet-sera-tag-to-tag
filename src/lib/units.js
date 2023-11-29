export class Units {
  static units = 'ft'

  static ftToCm (ft) {
    const cm = ft * 30.48
    return cm
  }

  static cmToFt (cm) {
    const ft = cm / 30.48
    return ft
  }

  static fromCm (value) {
    // cm to ft
    if (this.units === 'ft') {
      return this.cmToFt(value)
    }
    // cm to m
    return value / 100
  }

  static toCm (value) {
    // ft to cm
    if (this.units === 'ft') {
      return this.ftToCm(value)
    }
    // m to cm
    return value * 100
  }

  static distance (x0, y0, x1, y1) {
    return Math.sqrt(((x1 - x0) * (x1 - x0)) + ((y1 - y0) * (y1 - y0)))
  }

  static distance3d (p1, p2) {
    const v = Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y) + (p1.z - p2.z) * (p1.z - p2.z))
    return v
  }

  static getDistanceBetweenTags (t1, t2, corrected) {
    let measurementCount = 0
    let dist1 = 0
    let dist2 = 0
    if (corrected) {
      // Find distance from t1 to t2
      for (const k of Object.keys(t1.rangeCorrectedDb)) {
        if (k === t2.shortAddr) {
          dist1 = t1.rangeCorrectedDb[k]
          measurementCount++
          break
        }
      }

      // Find distance from t2 to t1
      for (const k of Object.keys(t2.rangeCorrectedDb)) {
        if (k === t1.shortAddr) {
          dist2 = t2.rangeCorrectedDb[k]
          measurementCount++
          break
        }
      }
    } else {
      // Find distance from t1 to t2
      for (const k of Object.keys(t1.rangeDb)) {
        if (k === t2.shortAddr) {
          dist1 = t1.rangeDb[k]
          measurementCount++
          break
        }
      }

      // Find distance from t2 to t1
      for (const k of Object.keys(t2.rangeDb)) {
        if (k === t1.shortAddr) {
          dist2 = t2.rangeDb[k]
          measurementCount++
          break
        }
      }
    }
    if (measurementCount === 0) return 0
    return (dist1 + dist2) / measurementCount // return the average reading between the nodes
  }

  // Original Source: http://paulbourke.net/geometry/circlesphere/tvoght.c
  // Find intersection points given 2 circles' x,y center point and radius
  static circle_circle_intersection (x0, y0, r0, x1, y1, r1) {
    /* dx and dy are the vertical and horizontal distances between
        * the circle centers.
        */
    const dx = x1 - x0
    const dy = y1 - y0

    /* Determine the straight-line distance between the centers. */
    const d = Math.sqrt((dy * dy) + (dx * dx))

    /* Check for solvability. */
    if (d > (r0 + r1)) {
      /* no solution. circles do not intersect. */
    //    console.log("No solution, circles do not intersect")
      return []
    }
    if (d < Math.abs(r0 - r1)) {
      /* no solution. one circle is contained in the other */
    //    console.log("No solution, one circle is contained in the other")
      return []
    }

    /* 'point 2' is the point where the line through the circle
        * intersection points crosses the line between the circle
        * centers.
        */

    /* Determine the distance from point 0 to point 2. */
    const a = ((r0 * r0) - (r1 * r1) + (d * d)) / (2.0 * d)

    /* Determine the coordinates of point 2. */
    const x2 = x0 + (dx * a / d)
    const y2 = y0 + (dy * a / d)

    /* Determine the distance from point 2 to either of the
        * intersection points.
        */
    const h = Math.sqrt((r0 * r0) - (a * a))

    /* Now determine the offsets of the intersection points from
        * point 2.
        */
    const rx = -dy * (h / d)
    const ry = dx * (h / d)

    /* Determine the absolute intersection points. */
    const xi = x2 + rx
    const xiPrime = x2 - rx
    const yi = y2 + ry
    const yiPrime = y2 - ry

    return [{ x: xi, y: yi }, { x: xiPrime, y: yiPrime }]
  }

  // Original Source: https://gist.github.com/ahcurrier/1a03faa8b0c2420ec6fd#file-intersect3spheres-js
  /*
    Find the intersection(s) (x,y,z) and (x_,y_,z_) of three spheres centered
    at (x1,y1,z1), (x2,y2,z2) and (x3,y3,z3) with corresponding radii of r1, r2, and r3

    Adapted from http://mathforum.org/library/drmath/view/64311.html
  */
  static intersect3spheres (x1, x2, x3, y1, y2, y3, z1, z2, z3, r1, r2, r3) {
    let e, f, g, h
    /*
      Three spheres:
      EQ1: (x1 - x)^2 + (y1 - y)^2 + (z1 - z)^2 = r1^2
      EQ2: (x2 - x)^2 + (y2 - y)^2 + (z2 - z)^2 = r2^2
      EQ3: (x3 - x)^2 + (y3 - y)^2 + (z3 - z)^2 = r3^2

      1. Pick one of the equations (EQ2) and subtract it from the other two (EQ1, EQ3).
      That will make those other two equations into linear equations in the three unknowns.
    */

    // Subtract EQ2 from EQ1, move all constants to right side
    // Call the right side constant k1
    const k1 = r1 * r1 - r2 * r2 - x1 * x1 + x2 * x2 - y1 * y1 + y2 * y2 - z1 * z1 + z2 * z2

    // Left side of EQ1 is of the form a1x + b1y + c1z
    // where a1, b1, and c1 are the coefficients
    const a1 = 2 * (x2 - x1)
    const b1 = 2 * (y2 - y1)
    const c1 = 2 * (z2 - z1)

    // Subtract EQ2 from EQ3, move all constants to right side
    // Call the right side constant k3
    const k3 = r3 * r3 - r2 * r2 - x3 * x3 + x2 * x2 - y3 * y3 + y2 * y2 - z3 * z3 + z2 * z2

    // Left side of EQ3 is of the form a3x + b3y + c3z
    // where a3, b3, and c3 are the coefficients
    const a3 = 2 * (x2 - x3)
    const b3 = 2 * (y2 - y3)
    const c3 = 2 * (z2 - z3)

    // The two equations (EQ1, EQ3) are now linear equations in the three unknowns:
    // EQ1: a1x + b1y + c1z = k1
    // EQ3: a3x + b3y + c3z = k3

    /*
      2. Use them to find two of the variables (x, y) as linear expressions in the
      third (z).  These two equations are those of a line in 3-space, which
      passes through the two points of intersection of the three spheres.
    */

    // Find y as a linear expression of z.
    // y = ez + f

    if (a1 === 0) {
      // y = -(c1/b1)z + k1/b1
      e = -c1 / b1
      f = k1 / b1
    } else if (a3 === 0) {
      // y = -(c3/b3)z + k3/b3
      e = -c3 / b3
      f = k3 / b3
    } else {
      // If a1 and a3 are non-zero:
      // Multiply EQ1 by a3 / a1, then subtract EQ3 from it.
      // This gives a new equation with coefficients

      const a31 = a3 / a1

      // Subtract equations, x term cancels out. Left with:
      // (a31 * b1 - b3)y + (a31 * c1 - c3)z = a31 * k1 - k3

      e = -((a31 * c1 - c3) / (a31 * b1 - b3))
      f = (a31 * k1 - k3) / (a31 * b1 - b3)
    }

    // Find x as a linear expression of z.
    // x = gz + h

    if (b1 === 0) {
      g = -c1 / a1
      h = k1 / a1
    } else if (b3 === 0) {
      g = -c3 / a3
      h = k3 / a3
    } else {
      // If b1 and b3 are non-zero:
      // Multiply EQ1 by b3 / b1, then subtract EQ3 from it.
      // This gives a new equation with coefficients

      const b31 = b3 / b1

      // Subtract equations, y term cancels out. Left with:
      // (b31 * a1 - a3)x + (b31 * c1 - c3)z = b31 * k1 - k3

      g = -((b31 * c1 - c3) / (b31 * a1 - a3))
      h = (b31 * k1 - k3) / (b31 * a1 - a3)
    }

    /*
      3. Then substitute these into the equation of any of the original
      spheres (EQ1).  This will give you a quadratic equation in one variable,
      which you can solve to find the two roots.

      EQ1: (x1 - x)^2 + (y1 - y)^2 + (z1 - z)^2 = r1^2
      EQ1: (x1 - gz - h)^2 + (y1 - ez - f)^2 + (z1 - z)^2 = r1^2

      x1^2 - x1gz - x1h - x1gz + g^2 * z^2 + ghz - x1h + ghz + h^2 +
      y1^2 - y1ez - y1f - y1ez + e^2 * z^2 + efz - y1f + efz + f^2 +
      z1^2 - 2z1z + z^2
      = r1^2

      Simplify and put in quadratic form of Az^2 + Bz + C = 0

      x1^2 + y1^2 + z1^2 - x1h - y1f - x1h - y1f + h^2 + f^2
      - x1gz - y1ez - 2z1z - x1gz - y1ez + ghz + efz + ghz + efz
      + g^2 * z^2 + e^2 * z^2 + z^2
      = r1^2

      x1^2 + y1^2 + z1^2 - x1h - y1f - x1h - y1f + h^2 + f^2 - r1^2
      + (- x1g- y1e - 2z1 - x1g - y1e + gh + ef + gh + ef) * z
      + (g^2 + e^2 + 1) * z^2
      = 0
    */

    const A = g * g + e * e + 1
    const B = -x1 * g - y1 * e - 2 * z1 - x1 * g - y1 * e + 2 * g * h + 2 * e * f
    const C = x1 * x1 + y1 * y1 + z1 * z1 - 2 * x1 * h - 2 * y1 * f + h * h + f * f - r1 * r1

    // Quadratic formula: z = (-B +- sqrt(B^2 - 4AC)) / 2A
    // Use the quadratic formula to solve to find the two roots.
    //
    const rootD = Math.sqrt(B * B - 4 * A * C)

    const z = (-B + rootD) / (2 * A)
    const z_ = (-B - rootD) / (2 * A)

    /*
      4. These values will allow you to determine the corresponding values of
      the other two variables, giving you the coordinates of the two
      intersection points.
    */

    const x = g * z + h
    const x_ = g * z_ + h

    const y = e * z + f
    const y_ = e * z_ + f

    return [x, y, z, x_, y_, z_]
  }
}
