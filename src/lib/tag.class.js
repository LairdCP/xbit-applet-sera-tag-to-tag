import { Units } from './units.js'
import { MovingAverage } from './moving-average.js'
import AppState from './app-state.store.js'
import { TagDb } from './tag-db.js'

export class Tag {
  name
  deviceAddress = ''
  role
  locked
  longAddr
  shortAddr
  position
  rangeFilters = {}
  rangeDb = {}
  rangeLastSeenDb = {}
  rangeCorrectedDb = {}
  radius
  ranges = []
  errors = []
  yzLineWeight = 2
  roomOrientationRotation = 0
  roomOrientationOffset
  flipX = 1
  flipZ = 1
  averageRangeError = 0
  colorIndex

  static colors = [
    { r: 255, g: 0, b: 0, a: 255 },
    { r: 255, g: 150, b: 20, a: 255 },
    { r: 245, g: 210, b: 20, a: 255 },
    { r: 0, g: 200, b: 50, a: 255 },
    { r: 0, g: 200, b: 205, a: 255 },
    { r: 0, g: 50, b: 255, a: 255 },
    { r: 200, g: 50, b: 200, a: 255 }
  ]

  constructor (name, position, tagRadius, role, colorIndex) {
    this.name = name
    this.position = position
    this.role = role
    this.radius = tagRadius
    this.locked = false
    this.setColorIndex(colorIndex)
    this.roomOrientationOffset = { x: 0, y: 0, z: 0 }
  }

  cycleColor () {
    this.colorIndex++
    this.colorIndex %= Tag.colors.length
    this.color = Tag.colors[this.colorIndex]
  }

  setColorIndex (i) {
    this.colorIndex = i
    this.colorIndex %= Tag.colors.length
    this.color = Tag.colors[this.colorIndex]
  }

  setColorRgb (r, g, b) {
    this.color = { r, g, b, a: 255 }
  }

  getX () {
    if (this.role === 'fixed') {
      return this.flipX * ((this.position.x * Math.cos(this.roomOrientationRotation) - this.position.z * Math.sin(this.roomOrientationRotation)) + this.roomOrientationOffset.x)
    }
    return this.position.x
  }

  getY () {
    if (this.role === 'fixed') {
      return this.position.y + this.roomOrientationOffset.y
    }
    return this.position.y
  }

  getZ () {
    if (this.role === 'fixed') {
      return this.flipZ * ((this.position.z * Math.cos(this.roomOrientationRotation) + this.position.x * Math.sin(this.roomOrientationRotation)) + this.roomOrientationOffset.z)
    }
    return this.position.z
  }

  draw2d () {
    const sketch = AppState.sketch
    sketch.strokeWeight(0)
    sketch.stroke(255, 0, 0, 255)
    sketch.fill(this.color.r, this.color.g, this.color.b, this.color.a)
    if (this.role === 'fixed') {
      sketch.rect(this.getX() - this.radius, this.getY() - this.radius, this.radius * 2, this.radius * 2)
    } else if (this.role === 'mobile') {
      sketch.circle(this.getX(), this.getY(), this.radius * 2)
    }

    sketch.textSize(30)
    sketch.strokeWeight(0)
    sketch.stroke(255, 0, 0)
    sketch.fill(255, 255, 255, 255)
    sketch.text(this.name, this.getX() - 10, this.getY() + 10)

    sketch.textSize(15)
    if (Object.keys(this.rangeDb).length > 0) {
      let yoff = 0
      for (const k of Object.keys(this.rangeDb)) {
        sketch.text(k + ':' + this.rangeDb[k], this.getX() - sketch.textWidth(k) / 2, this.getY() + 30 + yoff)
        yoff += 20
      }
    }

    if (this.shortAddr) {
      sketch.text(this.shortAddr, this.getX() - sketch.textWidth(this.shortAddr) / 2, this.getY() - 22)
    }
  }

  draw3d () {
    const sketch = AppState.sketch
    const buffer3d = AppState.buffer3d
    buffer3d.push()
    buffer3d.translate(
      this.getX(),
      this.getY(),
      this.getZ()
    )

    buffer3d.noStroke()

    buffer3d.shininess(30)
    buffer3d.specularMaterial(120, 120, 120)

    const c = sketch.color(this.color.r, this.color.g, this.color.b)
    c.setAlpha(255)
    buffer3d.ambientMaterial(c)

    if (this.role === 'fixed') {
      buffer3d.box(this.radius * 2)
    } else if (this.role === 'mobile') {
      buffer3d.sphere(this.radius)
    }
    buffer3d.pop()

    // Draw lines to the back and ground plane grids
    buffer3d.strokeWeight(this.yzLineWeight)
    buffer3d.stroke(40, 70, 80)
    buffer3d.line(this.getX(), this.getY(), this.getZ(), this.getX(), AppState.grid.height / 2, this.getZ())
    buffer3d.line(this.getX(), this.getY(), this.getZ(), this.getX(), this.getY(), -AppState.grid.depth / 2)

    // drop a line down to the height of the first tag in the rangeDb
    if (Object.keys(this.rangeDb).length > 0) {
      // let lineOff = 0
      for (const k of Object.keys(this.rangeDb)) {
        const remoteTag = TagDb.getTagByShortAddress(k)
        if (remoteTag) {
          // buffer3d.stroke(255, 255, 0);
          // buffer3d.line(this.getX() + lineOff, this.getY(), this.getZ(), this.getX() + lineOff, remoteTag.getY(), this.getZ());

          // Now calculate the actual x/z distance between this tag and the remote tag
          const a = this.rangeDb[k]
          const b = remoteTag.getY() - this.getY()
          const correctedRange = Math.sqrt(Math.pow(a, 2) - Math.pow(b, 2))
          this.rangeCorrectedDb[k] = correctedRange
        }
        // lineOff += 5
      }
    }
    buffer3d.noStroke()
  }

  drawTopAndFrontViews () {
    // Draw on the side menu top view map ==========================
    const grid = AppState.grid
    const sketch = AppState.sketch
    const viewportMenu = AppState.viewportMenu

    sketch.push()
    sketch.translate(viewportMenu.x, viewportMenu.y)
    sketch.fill(this.color.r, this.color.g, this.color.b, this.color.a)

    if (this.role === 'fixed') {
      sketch.rect(grid.topGrid.x + (grid.topGrid.xextent / 2) + (this.getX() - 1 * this.radius) * grid.topviewScale, grid.topGrid.y + (grid.topGrid.yextent / 2) + (this.getZ() - 1 * this.radius) * grid.topviewScale,
        this.radius * 2 * grid.topviewScale, this.radius * 2 * grid.topviewScale)
    } else if (this.role === 'mobile') {
      sketch.circle(grid.topGrid.x + (grid.topGrid.xextent / 2) + (this.getX() * grid.topviewScale), grid.topGrid.y + (grid.topGrid.yextent / 2) + (this.getZ() * grid.topviewScale), this.radius * 4 * grid.topviewScale)
    }
    sketch.textSize(12)
    sketch.strokeWeight(0)
    sketch.fill(255, 255, 255, 255)
    sketch.text(this.name, grid.topGrid.x + (grid.topGrid.xextent / 2) + (this.getX()) * grid.topviewScale - 5, grid.topGrid.y + (grid.topGrid.yextent / 2) + (this.getZ()) * grid.topviewScale + 4)

    // Draw on the side menu front view map ==========================
    sketch.fill(this.color.r, this.color.g, this.color.b, this.color.a)
    if (this.role === 'fixed') {
      sketch.rect(grid.frontGrid.x + (grid.frontGrid.xextent / 2) + (this.getX() - 1 * this.radius) * grid.frontviewScale, grid.frontGrid.y + (grid.frontGrid.yextent / 2) + (this.getY() - 1 * this.radius) * grid.frontviewScale,
        this.radius * 2 * grid.frontviewScale, this.radius * 2 * grid.frontviewScale)
    } else if (this.role === 'mobile') {
      sketch.circle(grid.frontGrid.x + (grid.frontGrid.xextent / 2) + (this.getX() * grid.frontviewScale), grid.frontGrid.y + (grid.frontGrid.yextent / 2) + (this.getY() * grid.frontviewScale), this.radius * 4 * grid.frontviewScale)
    }

    sketch.textSize(12)
    sketch.strokeWeight(0)
    sketch.fill(255, 255, 255, 255)
    sketch.text(this.name, grid.frontGrid.x + (grid.frontGrid.xextent / 2) + (this.getX()) * grid.frontviewScale - 5, grid.frontGrid.y + (grid.frontGrid.yextent / 2) + (this.getY()) * grid.frontviewScale + 4)

    sketch.fill(255)
    sketch.textSize(12)
    if ((grid.frontGrid.y + (grid.frontGrid.yextent / 2) + (this.getY()) * grid.frontviewScale - 12) - grid.frontGrid.y > 16) {
      sketch.text(Units.fromCm(grid.height / 2 - this.getY()).toFixed(1), grid.frontGrid.x + (grid.frontGrid.xextent / 2) + (this.getX()) * grid.frontviewScale - 9, grid.frontGrid.y + (grid.frontGrid.yextent / 2) + (this.getY()) * grid.frontviewScale - 18)
    } else {
      sketch.text(Units.fromCm(grid.height / 2 - this.getY()).toFixed(1), grid.frontGrid.x + (grid.frontGrid.xextent / 2) + (this.getX()) * grid.frontviewScale - 9, grid.frontGrid.y + (grid.frontGrid.yextent / 2) + (this.getY()) * grid.frontviewScale + 32)
    }
    sketch.pop()
  }

  drawRange () {
    const buffer3d = AppState.buffer3d
    const sketch = AppState.sketch

    const rangeAlpha = 160
    const rangeColor = sketch.color(190, 190, 190)

    if (this.role === 'fixed') {
      buffer3d.fill(rangeColor.levels[0], rangeColor.levels[1], rangeColor.levels[2], rangeAlpha) // *** THIS DETERMINES ALPHA FOR THE RANGE SPHERE
      buffer3d.ambientMaterial(rangeColor.levels[0], rangeColor.levels[1], rangeColor.levels[2])
      buffer3d.specularMaterial(255, 255, 255)
      buffer3d.shininess(30)

      buffer3d.push()
      buffer3d.translate(this.getX(), this.getY(), this.getZ())

      // for each mobile tag, draw a sphere
      if (Object.keys(this.rangeDb).length > 0) {
        buffer3d.specularMaterial(0)
        buffer3d.blendMode(sketch.SCREEN)
        buffer3d.shininess(1200)
        buffer3d.ambientMaterial(0)
        buffer3d.emissiveMaterial(0, 35, 0, 10)
        buffer3d.fill(0)
        for (const k of Object.keys(this.rangeDb)) {
          const t = TagDb.getTagByShortAddress(k)
          if (t && t.role === 'mobile') {
            buffer3d.sphere(this.rangeDb[k] - t.averageRangeError, 32, 32)
            // buffer3d.sphere(this.rangeDb[k] + t.averageRangeError, 32, 32);
          }
        }
      }
      buffer3d.pop()
    }
  }

  addRange (remoteTagShortAddress, dist) {
    // Filter the distances using a moving average filter
    if (!this.rangeFilters[remoteTagShortAddress]) {
      this.rangeFilters[remoteTagShortAddress] = new MovingAverage(10)
    }
    this.rangeDb[remoteTagShortAddress] = this.rangeFilters[remoteTagShortAddress].next(dist)
    this.rangeLastSeenDb[remoteTagShortAddress] = Date.now()
  }

  getLastRangeFromTagSinceNow (remoteTagShortAddress) {
    if (this.rangeLastSeenDb[remoteTagShortAddress]) {
      return Date.now() - this.rangeLastSeenDb[remoteTagShortAddress]
    }
    return Number.MAX_SAFE_INTEGER
  }

  draw () {
    if (AppState.displayFont) {
      AppState.buffer3d.textFont(AppState.displayFont)
    }
    if (AppState.viewMode === '2D') {
      return this.draw2d()
    } else if (AppState.viewMode === '3D') {
      return this.draw3d()
    }
  }
}
