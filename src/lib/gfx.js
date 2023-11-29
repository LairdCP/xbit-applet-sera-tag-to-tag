import AppState from './app-state.store.js'

export class Gfx {
  static enableBlending (sketch, buffer3d) {
    const gl = AppState.gl
    buffer3d.drawingContext.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    buffer3d.drawingContext.enable(gl.BLEND)
    buffer3d.blendMode(sketch.ADD)
    buffer3d.drawingContext.depthFunc(gl.LEQUAL)
    buffer3d.drawingContext.enable(gl.DEPTH_TEST)
    buffer3d.drawingContext.enable(gl.STENCIL_TEST)
    buffer3d.drawingContext.depthMask(false)
  }

  static disableBlending (buffer3d) {
    const gl = AppState.gl
    buffer3d.drawingContext.disable(gl.BLEND)
    buffer3d.drawingContext.depthMask(true)
  }
}
