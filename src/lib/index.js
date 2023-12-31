import { addScreenPositionFunction } from './addScreenPositionFunction.js'
import AppState from './app-state.store.js'

export function drawCenterMarker () {
  /*
      // Draw a blue sphere at 0,0,0 for reference
      buffer3d.emissiveMaterial(0, 0, 0);
      buffer3d.specularMaterial(255, 255, 255);
      var c = color(0, 0, 255);
      buffer3d.ambientMaterial(c);
      buffer3d.shininess(100);
      buffer3d.push();
      buffer3d.translate(0, 0, 0);
      buffer3d.sphere(Units.ftToCm(0.2));
      buffer3d.pop();
  */
}

export function setupBuffer3d () {
  const buffer3d = AppState.sketch.createGraphics(AppState.viewport3d.width, AppState.viewport3d.height, AppState.sketch.WEBGL, AppState.p5Canvas)

  addScreenPositionFunction(AppState.sketch)
  buffer3d.perspective(Math.PI / 3, AppState.viewport3d.width / AppState.viewport3d.height, 0.5, 12000)
  // buffer3d.ortho(-AppState.viewport3d.width/4, AppState.viewport3d.width/4, -AppState.viewport3d.height/4, AppState.viewport3d.height/4, 1.0, 12000)
  const cam = buffer3d.createCamera()
  cam.setPosition(320, -420, 320)

  const gl = buffer3d._renderer.GL
  buffer3d.drawingContext.depthMask(true)
  buffer3d.setAttributes('premultipliedAlpha', false)
  buffer3d.setAttributes('alpha', true)
  buffer3d.setAttributes('preserveDrawingBuffer', false)
  buffer3d.setAttributes('depth', true)
  return { buffer3d, gl, cam }
}

export function styleButton (btn) {
  btn.style('color:#fff')
  btn.style('background:#333')
  btn.style('padding: 4px')
  btn.style('border:0px')
  btn.style('border-radius:5px')
}

export function styleInput (inp) {
  inp.style('background:#333')
  inp.style('color:#fff')
  inp.style('border: 0px')
}

export function styleSlider (slider) {
  slider.style('-webkit-appearance', 'none')
  slider.style('background', '#333')
  slider.style('border-radius: 5px')
}
