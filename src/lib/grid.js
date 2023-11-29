import { Units } from './units.js'
import AppState from './app-state.store.js'

export class Grid {
  environmentScale = 1
  gridStrokeWeight = 1
  width = 6
  height = 6
  depth = 6
  topviewScale = 0.18
  topGrid = {
    x: 10, y: 26, width: 220, height: 220
  }

  frontviewScale = 0.18
  frontGrid = {
    x: 10, y: 270, width: 220, height: 220
  }

  constructor (w, h, d) {
    this.width = w * this.environmentScale // X-axis
    this.height = h * this.environmentScale // y-axis
    this.depth = d * this.environmentScale // z-axis
  }

  draw () {
    const buffer3d = AppState.buffer3d
    if (AppState.viewMode === '3D') {
      buffer3d.push()
      buffer3d.strokeWeight(this.gridStrokeWeight)

      let inc = 0
      let zd = 0
      let segments = 0
      const cmPerSegment = Units.toCm(1) * this.environmentScale
      // BACK GRID
      buffer3d.stroke(90)
      zd = -this.depth / 2
      segments = this.height / cmPerSegment
      inc = this.height / segments
      for (let y = 0; y <= (this.height + 0.005); y += inc) {
        buffer3d.line(-this.width / 2, this.height / 2 - y, zd, this.width / 2, this.height / 2 - y, zd)
      }
      segments = this.width / cmPerSegment
      inc = this.width / segments
      for (let x = 0; x <= (this.width + 0.005); x += inc) {
        buffer3d.line(-this.width / 2 + x, -this.height / 2, zd, -this.width / 2 + x, this.height / 2, zd)
      }

      // FLOOR GRID
      buffer3d.stroke(120)
      zd = this.height / 2
      segments = this.depth / cmPerSegment
      inc = this.depth / segments
      for (let y = 0; y <= (this.depth + 0.005); y += inc) {
        buffer3d.line(-this.width / 2, zd, -this.depth / 2 + y, this.width / 2, zd, -this.depth / 2 + y)
      }

      segments = this.width / cmPerSegment
      inc = this.width / segments
      for (let x = 0; x <= (this.width + 0.005); x += inc) {
        buffer3d.line(-this.width / 2 + x, zd, -this.depth / 2, -this.width / 2 + x, zd, this.depth / 2)
      }

      buffer3d.pop()
    }
  }

  drawTopAndFrontGrids () {
    const sketch = AppState.sketch
    const viewportMenu = AppState.viewportMenu

    let xinc = 0
    let yinc = 0
    let xsegments = 0
    let ysegments = 0
    const cmPerSegment = Units.toCm(1) * this.environmentScale

    // console.log('cmPerSegment', cmPerSegment)
    // right menu background rectangle
    sketch.push()

    sketch.translate(viewportMenu.x, viewportMenu.y)

    sketch.noStroke()
    sketch.fill('rgba(20, 20, 20, 0.5)')
    sketch.rect(0, 0, viewportMenu.width, viewportMenu.height)

    // right menu top view
    // adjust top view grid size and increments to match "3D Grid" size
    if (isNaN(this.width) || isNaN(this.height) || isNaN(this.depth)) {
      return
    }
    xsegments = this.width / cmPerSegment // xsegments = # of gridlines on x axis in screen coords
    ysegments = this.depth / cmPerSegment // ysegments = # of gridlines on y axis in screen coords
    if (this.width > this.depth) {
      xinc = this.topGrid.width / xsegments
      yinc = xinc
      this.topviewScale = this.topGrid.width / this.width
      // this.topGrid.height = inc * (this.depth / cmPerSegment);
    } else {
      yinc = this.topGrid.height / ysegments
      xinc = yinc
      this.topviewScale = this.topGrid.height / this.depth
      // this.topGrid.width = inc * (this.width / cmPerSegment);
    }

    sketch.fill(255)
    sketch.textSize(14)
    sketch.textStyle(sketch.BOLD)
    sketch.noStroke()
    sketch.text('Top View', this.topGrid.x, this.topGrid.y - 6)
    sketch.strokeWeight(1)
    sketch.stroke(60, 60, 60)

    // draw vertical gridlines
    // xsegments = this.width / cmPerSegment;
    sketch.fill('rgba(20, 20, 20, 0.1)')
    this.topGrid.xextent = xinc * xsegments
    this.topGrid.yextent = yinc * ysegments
    sketch.rect(this.topGrid.x, this.topGrid.y, this.topGrid.xextent, this.topGrid.yextent)

    let segctr = 0
    for (let x = 0; segctr <= xsegments; x += xinc) {
      sketch.line(this.topGrid.x + x, this.topGrid.y, this.topGrid.x + x, this.topGrid.y + this.topGrid.yextent)
      segctr++
    }
    // draw horizontal gridlines
    // ysegments = this.depth / cmPerSegment;
    segctr = 0
    for (let y = 0; segctr <= ysegments; y += yinc) {
      sketch.line(this.topGrid.x, this.topGrid.y + y, this.topGrid.x + this.topGrid.xextent, this.topGrid.y + y)
      segctr++
    }

    // right menu front view

    // adjust front view grid size and increments to match "3D Grid" size
    xsegments = this.width / cmPerSegment // segments = # of gridlines
    ysegments = this.height / cmPerSegment // segments = # of gridlines
    if (this.width > this.height) {
      xinc = this.frontGrid.width / xsegments
      yinc = xinc
      this.frontviewScale = this.frontGrid.width / this.width
      // this.frontGrid.height = inc * (this.height / xsegments);
    } else {
      yinc = this.frontGrid.height / ysegments
      xinc = yinc
      this.frontviewScale = this.frontGrid.height / this.height
      // this.frontGrid.width = inc * (this.width / ysegments);
    }

    sketch.fill('rgba(20, 20, 20, 0.1)')
    this.frontGrid.xextent = xinc * xsegments
    this.frontGrid.yextent = yinc * ysegments
    sketch.rect(this.frontGrid.x, this.frontGrid.y, this.frontGrid.xextent, this.frontGrid.yextent)
    sketch.fill(255)
    sketch.textSize(14)
    sketch.textStyle(sketch.BOLD)
    sketch.noStroke()
    sketch.text('Front View', this.frontGrid.x, this.frontGrid.y - 6)
    sketch.strokeWeight(1)
    sketch.stroke(60, 60, 60)

    // draw vertical gridlines
    xsegments = this.width / cmPerSegment
    segctr = 0
    for (let x = 0; segctr <= xsegments; x += xinc) {
      sketch.line(this.frontGrid.x + x, this.frontGrid.y, this.frontGrid.x + x, this.frontGrid.y + this.frontGrid.yextent)
      segctr++
    }
    ysegments = this.height / cmPerSegment
    segctr = 0
    for (let y = 0; segctr <= ysegments; y += yinc) {
      sketch.line(this.frontGrid.x, this.frontGrid.y + y, this.frontGrid.x + this.frontGrid.xextent, this.frontGrid.y + y)
      segctr++
    }

    sketch.pop()
  }

  // updateRoomDimensions ({ w, h, d }) {
  //   this.grid.width = Units.toCm(parseFloat(w) + 0.02)
  //   this.grid.height = Units.toCm(parseFloat(h))
  //   this.grid.depth = Units.toCm(parseFloat(d) + 0.02)
  // }
}
