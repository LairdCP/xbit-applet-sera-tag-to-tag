/* globals p5 */
/* Sera Tag-2-Tag application script */

import { xbit, ToggleButton } from '@bennybtl/xbit-lib'
import p5 from 'p5/lib/p5';

import { TagDb } from './lib/tag-db.js'
import {
  drawCenterMarker,
  setupBuffer3d
} from './lib/index.js'
import { Gfx } from './lib/gfx.js'
import { Units } from './lib/units.js'
import { Grid } from './lib/grid.js'
import TagScene from './lib/tag-scene.js'
import AppState from './lib/app-state.store.js'
import { addScreenPositionFunction } from './lib/addScreenPositionFunction.js'

p5.disableFriendlyErrors = true // disable FES for improved performance

let dotNetHelper // eslint-disable-line no-unused-vars
function setDotNotHelper (helper) { // eslint-disable-line no-unused-vars
  dotNetHelper = helper
}

AppState.dataChanged = false
AppState.grid = null
AppState.showRangeSpheres = false
AppState.tagsBelowAnchors = true
AppState.cameraYShift = -100

AppState.scanButton = new ToggleButton('start-scan', 'Stop Scan', 'Start Scan', ['fa-spinner', 'fa-spin-pulse'], 'fa-wifi', false)
AppState.toggleOverlayButton = new ToggleButton('toggle-overlay', 'Hide 2D Grids', 'Show 2D Grids', 'fa-border-all', 'fa-border-none', false)
const alertText = document.getElementById('alert-text')

const s = (sketch) => {
  let cam

  // UI options and elements
  let zoomFactor = 3
  let zoom2d = 1.0
  let selectedTag

  // seem like constants
  AppState.displayFont = sketch.loadFont(`${xbit.baseUrl}/Comfortaa-Regular.ttf`)
  AppState.sketch = sketch

  const updateViewports = () => {
    AppState.viewport = { x: 0, y: 0, width: sketch.windowWidth, height: sketch.windowHeight }
    AppState.viewport3d = { x: 0, y: 0, width: AppState.viewport.width, height: AppState.viewport.height }
    if (AppState.toggleOverlayButton.state) {
      AppState.viewportMenu = { x: AppState.viewport.width - 240, y: 0, width: 240, height: AppState.viewport.height }
    } else {
      AppState.viewportMenu = { x: AppState.viewport.width, y: 0, width: 240, height: AppState.viewport.height }
    }
  }

  const updateOrbitCam = () => {
    const orbitSensitivityX = 0.5
    const orbitSensitivityY = 0.5
    const orbitScaleFactor = 125

    // The _orbit function updates the Euler angles for the position of
    // the camera around the target towards which it is oriented, and
    // adjusts its distance from the target.
    cam.lookAt(0, 0, 0)
    const deltaTheta = (-orbitSensitivityX * (sketch.mouseX - sketch.pmouseX)) / orbitScaleFactor
    const deltaPhi = (orbitSensitivityY * (sketch.mouseY - sketch.pmouseY)) / orbitScaleFactor
    cam._orbit(deltaTheta, deltaPhi, 0)
    AppState.dataChanged = true
  }

  sketch.draw = () => {
    const rangingLinesStrokeWeight = 4
    const grid = AppState.grid
    let remoteTag

    // To support 3D objects with alpha
    // 1.) Make sure gl.enable(gl.DEPTH_TEST) and gl.depthMask(true) is set so solid objects are drawn at proper z-depth
    // 2.) Draw all fully opaque objects
    // 3.) Set depthMask(false) so transparent objects don't write to the depth buffer
    // 4.) Use painters algorithm to draw semi-transparent objects from back to front
    if (AppState.dataChanged) {
      let c
      let textPos
      let tsize

      // clear();
      sketch.background(20, 20, 30, 255)
      sketch.textFont(AppState.displayFont)

      switch (AppState.viewMode) {
        case '3D':
          AppState.buffer3d.clear()
          AppState.buffer3d.drawingContext.enable(AppState.gl.CULL_FACE)
          AppState.buffer3d.drawingContext.cullFace(AppState.gl.FRONT)
          AppState.buffer3d.background(20, 20, 30, 255)
          AppState.buffer3d.push()
          AppState.buffer3d.noStroke()
          AppState.buffer3d.translate(0, AppState.cameraYShift, 0)

          grid.draw()
          AppState.buffer3d.shininess(30)
          AppState.buffer3d.ambientLight(100, 100, 100)
          AppState.buffer3d.specularMaterial(10, 10, 10)
          c = sketch.color(100, 100, 100)
          c.setAlpha(255)
          AppState.buffer3d.ambientMaterial(c)

          // BACK WALL
          AppState.buffer3d.noStroke()
          AppState.buffer3d.push()
          AppState.buffer3d.translate(0, 0, -grid.depth / 2)
          AppState.buffer3d.ambientLight(20, 20, 20)
          AppState.buffer3d.pointLight(50, 50, 50, 0, -grid.depth / 2 + 10 + AppState.cameraYShift, 0)
          AppState.buffer3d.plane(grid.width, grid.height)
          AppState.buffer3d.pop()

          // LEFT WALL
          AppState.buffer3d.push()
          AppState.buffer3d.rotateY(Math.PI / 2)
          AppState.buffer3d.translate(0, 0, -grid.width / 2)
          AppState.buffer3d.ambientLight(20, 20, 20)
          AppState.buffer3d.pointLight(50, 50, 50, grid.width / 2, -200 + AppState.cameraYShift, 0)
          AppState.buffer3d.plane(grid.depth, grid.height)
          AppState.buffer3d.pop()

          // RIGHT WALL
          AppState.buffer3d.push()
          AppState.buffer3d.rotateY(-Math.PI / 2)
          AppState.buffer3d.translate(0, 0, -grid.width / 2)
          AppState.buffer3d.ambientLight(20, 20, 20)
          AppState.buffer3d.pointLight(50, 50, 50, -grid.width / 2, -200 + AppState.cameraYShift, 0)
          AppState.buffer3d.plane(grid.depth, grid.height)
          AppState.buffer3d.pop()

          // FLOOR
          AppState.buffer3d.push()
          AppState.buffer3d.rotateX(Math.PI / 2)
          AppState.buffer3d.translate(0, 0, -grid.height / 2)
          AppState.buffer3d.ambientLight(30, 30, 30)
          AppState.buffer3d.pointLight(80, 80, 80, 0, -10 + AppState.cameraYShift, 0)
          AppState.buffer3d.plane(grid.width, grid.depth)
          AppState.buffer3d.pop()

          AppState.buffer3d.directionalLight(250, 250, 250, 12, 6, -1)
          AppState.buffer3d.directionalLight(100, 100, 100, -12, -6, -1)
          AppState.buffer3d.ambientLight(155, 155, 155)

          for (const t of TagDb.tags) { t.draw() }

          drawCenterMarker()

          Gfx.enableBlending(sketch, AppState.buffer3d)

          for (const k of Object.keys(AppState.mobileTagIntersections)) {
            const mobileTagIntersection = AppState.mobileTagIntersections[k]
            const intersectionPoints = mobileTagIntersection.intersectionPoints
            const t = mobileTagIntersection.tag
            if (intersectionPoints) {
              AppState.buffer3d.blendMode(sketch.SCREEN)
              AppState.buffer3d.fill(0, 0, 0, 110) // *** THIS DETERMINES ALPHA FOR THE RANGE SPHERE
              AppState.buffer3d.ambientMaterial(0)
              AppState.buffer3d.emissiveMaterial(255, 255, 255)
              AppState.buffer3d.specularMaterial(255, 255, 255)
              AppState.buffer3d.shininess(5)

              if (Units.distance3d({ x: cam.eyeX, y: cam.eyeY, z: cam.eyeZ }, { x: intersectionPoints[0], y: intersectionPoints[1], z: intersectionPoints[2] }) <
                  Units.distance3d({ x: cam.eyeX, y: cam.eyeY, z: cam.eyeZ }, { x: intersectionPoints[3], y: intersectionPoints[4], z: intersectionPoints[5] })) {
                if (AppState.sphereSolution('one')) {
                  AppState.buffer3d.push()
                  AppState.buffer3d.translate(intersectionPoints[3], intersectionPoints[4], intersectionPoints[5])
                  AppState.buffer3d.sphere(t.averageRangeError)
                  AppState.buffer3d.pop()
                }

                if (AppState.sphereSolution('two')) {
                  AppState.buffer3d.push()
                  AppState.buffer3d.translate(intersectionPoints[0], intersectionPoints[1], intersectionPoints[2])
                  AppState.buffer3d.sphere(t.averageRangeError)
                  AppState.buffer3d.pop()
                }
              } else {
                if (AppState.sphereSolution('two')) {
                  AppState.buffer3d.push()
                  AppState.buffer3d.translate(intersectionPoints[0], intersectionPoints[1], intersectionPoints[2])
                  AppState.buffer3d.sphere(t.averageRangeError)
                  AppState.buffer3d.pop()
                }

                if (AppState.sphereSolution('one')) {
                  AppState.buffer3d.push()
                  AppState.buffer3d.translate(intersectionPoints[3], intersectionPoints[4], intersectionPoints[5])
                  AppState.buffer3d.sphere(t.averageRangeError)
                  AppState.buffer3d.pop()
                }
              }
              AppState.buffer3d.blendMode(sketch.ADD)
            }
          }

          if (AppState.showRangeSpheres) {
            for (const tr of TagDb.tags) {
              tr.drawRange()
            }
          }

          AppState.buffer3d.pop()

          Gfx.disableBlending(AppState.buffer3d)
          sketch.image(AppState.buffer3d, 0, 0)

          // Draw lines between ranging tags
          sketch.push()
          sketch.translate(AppState.viewport3d.width / 2, AppState.viewport3d.height / 2)

          sketch.strokeWeight(rangingLinesStrokeWeight)
          sketch.stroke(0, 255, 255, 64)
          for (const t of TagDb.tags) {
            for (const k of Object.keys(t.rangeDb)) {
              remoteTag = TagDb.getTagByShortAddress(k)
              if (remoteTag) {
                const p1 = AppState.buffer3d.screenPosition(t.getX(), t.getY() + AppState.cameraYShift, t.getZ())
                const p2 = AppState.buffer3d.screenPosition(remoteTag.getX(), remoteTag.getY() + AppState.cameraYShift, remoteTag.getZ())
                sketch.line(p1.x, p1.y, p2.x, p2.y)
              }
            }
          }

          sketch.noStroke()
          sketch.textSize(AppState.overlayTextSize)
          sketch.textStyle(sketch.NORMAL)
          sketch.fill(255)

          for (const t of TagDb.tags) {
            for (const k of Object.keys(t.rangeDb)) {
              remoteTag = TagDb.getTagByShortAddress(k)
              if (remoteTag) {
                const d = Units.distance(t.getX(), t.getZ(), remoteTag.getX(), remoteTag.getZ())

                const p1 = AppState.buffer3d.screenPosition(t.getX(), t.getY() + AppState.cameraYShift, t.getZ())
                const p2 = AppState.buffer3d.screenPosition(remoteTag.getX(), remoteTag.getY() + AppState.cameraYShift, remoteTag.getZ())

                sketch.text(Units.fromCm(d).toFixed(1), (p1.x + p2.x) / 2, (p1.y + p2.y) / 2)
              }
            }
          }
          sketch.pop()

          // Text overlay on 3D view for tag labeling
          sketch.push()
          sketch.translate(AppState.viewport3d.width / 2, AppState.viewport3d.height / 2)
          tsize = (AppState.overlayTextSize + 6) * (1 / (zoomFactor / 4))
          for (const t of TagDb.tags) {
            textPos = AppState.buffer3d.screenPosition(t.getX(), t.getY() + AppState.cameraYShift, t.getZ())
            sketch.stroke(0)
            sketch.fill(255)
            sketch.strokeWeight(3)
            sketch.textSize(tsize)
            sketch.textStyle(sketch.BOLD)
            sketch.text(t.name, textPos.x - sketch.textWidth(t.name) / 2, textPos.y + tsize / 2.5) // node label overlay

            sketch.textSize(tsize * 1.25)
            sketch.textStyle(sketch.NORMAL)
            sketch.noStroke()

            // Draw labels showing distance to other tags
            if (AppState.showRemoteDistances) {
              if (Object.keys(t.rangeDb).length > 0) {
                let yoff = 0
                for (const k of Object.keys(t.rangeDb)) {
                  const txt = k + ':' + t.rangeDb[k].toFixed(0)
                  sketch.text(txt, textPos.x - sketch.textWidth(txt) / 2, textPos.y + 30 + yoff)
                  yoff += 13
                }
              }
            }

            if (t.shortAddr) {
              sketch.textSize(tsize * 0.75)
              sketch.text(t.shortAddr, textPos.x - sketch.textWidth(t.shortAddr) / 2, textPos.y - (tsize * 1.2))
            }
          }
          sketch.pop()
          break
        case '2D':
        default:
          // Draw lines between ranging tags
          sketch.push()
          sketch.translate(AppState.viewport3d.width / 2, AppState.viewport3d.height / 2)
          sketch.scale(zoom2d)

          sketch.strokeWeight(rangingLinesStrokeWeight)
          sketch.stroke(255, 0, 255)

          for (const t of TagDb.tags) {
            for (const k of Object.keys(t.rangeDb)) {
              remoteTag = TagDb.getTagByShortAddress(k)
              if (remoteTag) {
                sketch.line(t.getX(), t.getY(), remoteTag.getX(), remoteTag.getY())
              }
            }
          }

          sketch.noStroke()
          for (const t of TagDb.tags) {
            for (const k of Object.keys(t.rangeDb)) {
              remoteTag = TagDb.getTagByShortAddress(k)
              if (remoteTag) {
                const d = Units.distance(t.getX(), t.getY(), remoteTag.getX(), remoteTag.getY())
                sketch.text(d.toFixed(0), (t.getX() + remoteTag.getX()) / 2, (t.getY() + remoteTag.getY()) / 2)
              }
            }
          }

          sketch.pop()
          sketch.push()
          sketch.translate(AppState.viewport3d.width / 2, AppState.viewport3d.height / 2)
          sketch.scale(zoom2d)

          // Draw each tag
          for (const t of TagDb.tags) {
            t.draw()
          }
          sketch.pop()
          break
      }

      sketch.textSize(20)
      sketch.strokeWeight(0)
      sketch.stroke(255, 0, 0)

      if (alertText.innerText !== AppState.alertText) {
        if (AppState.alertText !== '') {
          alertText.innerText = AppState.alertText
          alertText.style.display = 'block'
          const i = document.createElement('i')
          i.classList.add('mr-2', 'fa-solid', 'fa-triangle-exclamation')
          alertText.prepend(i)
        } else {
          alertText.innerText = ''
          alertText.style.display = 'none'
        }
      }

      // right menu background rectangle
      if (AppState.toggleOverlayButton.state) {
        grid.drawTopAndFrontGrids()

        for (const t of TagDb.tags) t.drawTopAndFrontViews()
      }
      sketch.textSize(14)
      sketch.fill(255)
      sketch.noStroke()

      // if (TagDb.tags.length > 2) {
      // // enable lock anchors button
      //   AppState.lockAnchorsButton.enable()
      // } else {
      //   AppState.lockAnchorsButton.disable()
      // }

      AppState.dataChanged = false
    }
  }

  sketch.setup = () => {
    // prevent right-click context menu
    document.oncontextmenu = function () {
      return false
    }

    updateViewports() // set viewport dimensions
    AppState.p5Canvas = document.getElementById('p5-canvas')
    sketch.createCanvas(AppState.viewport.width, AppState.viewport.height, AppState.p5Canvas)

    // Create the canvas as 3d
    const result = setupBuffer3d()
    AppState.buffer3d = result.buffer3d
    addScreenPositionFunction(AppState.buffer3d)
    AppState.gl = result.gl
    cam = result.cam

    updateOrbitCam()

    AppState.scanButton.button.addEventListener('click', () => {
      AppState.scanButton.toggle()
      if (AppState.scanButton.state) {
        xbit.sendStartBluetoothScanningCommand().then(() => {
        }).catch((err) => {
          console.log('error sending start scanning command', err)
          AppState.scanButton.toggle()
        })
      } else {
        AppState.scanStopping = true
        xbit.sendStopBluetoothScanningCommand().then(() => {
          setTimeout(() => {
            AppState.scanStopping = false
          }, 1000)
        }).catch((err) => {
          console.log('error sending stop scanning command', err)
          AppState.scanButton.toggle()
        })
      }
    })

    AppState.lockAnchorsButton = new ToggleButton('lock-anchors', 'Unlock Anchors', 'Lock Anchors', 'fa-lock', 'fa-lock-open', false)
    AppState.lockAnchorsButton.button.addEventListener('click', () => {
      AppState.lockAnchorsButton.toggle()
      if (AppState.lockAnchorsButton.state) {
        TagDb.lockAnchors()
        flipAnchorsXButton.enable()
        flipAnchorsZButton.enable()
        showRangeSpheres.enable()
        tagsBelowAnchors.enable()
        roomOrientationYSlider.disabled = false
        roomOrientationXSlider.disabled = false
        roomOrientationZSlider.disabled = false
      } else {
        TagDb.unlockAnchors()
        flipAnchorsXButton.disable()
        flipAnchorsZButton.disable()
        showRangeSpheres.disable()
        tagsBelowAnchors.disable()
        roomOrientationYSlider.disabled = true
        roomOrientationXSlider.disabled = true
        roomOrientationZSlider.disabled = true
      }
    })

    const flipAnchorsXButton = new ToggleButton('flip-anchors-x', 'Flip Anchors X', 'Flip Anchors X', 'fa-arrows-h', 'fa-arrows-h', false)
    flipAnchorsXButton.button.addEventListener('click', () => {
      flipAnchorsXButton.toggle()
      for (const t of TagDb.tags) {
        t.flipX *= -1
      }
    })

    const flipAnchorsZButton = new ToggleButton('flip-anchors-z', 'Flip Anchors Z', 'Flip Anchors Z', 'fa-arrows-v', 'fa-arrows-v', false)
    flipAnchorsZButton.button.addEventListener('click', () => {
      flipAnchorsZButton.toggle()
      for (const t of TagDb.tags) {
        t.flipZ *= -1
      }
    })

    const showRangeSpheres = new ToggleButton('show-range-spheres', 'Hide Range Spheres', 'Show Range Spheres', 'fa-eye-slash', 'fa-eye', false)
    showRangeSpheres.button.addEventListener('click', () => {
      showRangeSpheres.toggle()
      AppState.showRangeSpheres = showRangeSpheres.state
      AppState.dataChanged = true
    })

    const tagsBelowAnchors = new ToggleButton('tags-below-anchors', 'Tags Below Anchors', 'Tags Above Anchors', 'fa-arrow-down', 'fa-arrow-up', false)
    tagsBelowAnchors.button.addEventListener('click', () => {
      tagsBelowAnchors.toggle()
      AppState.tagsBelowAnchors = tagsBelowAnchors.state
      AppState.dataChanged = true
    })

    flipAnchorsXButton.disable()
    flipAnchorsZButton.disable()
    showRangeSpheres.disable()
    tagsBelowAnchors.disable()

    // Init Room
    //
    AppState.grid = new Grid(
      Units.toCm(parseFloat(16)),
      Units.toCm(parseFloat(10)),
      Units.toCm(parseFloat(16))
    )

    const roomOrientationYSlider = document.getElementById('roomOrientationYSlider')
    roomOrientationYSlider.attributes.min.value = 0
    roomOrientationYSlider.attributes.max.value = Math.PI * 2
    roomOrientationYSlider.attributes.step.value = Math.PI * 2 / 360
    roomOrientationYSlider.value = 0
    roomOrientationYSlider.addEventListener('input', (e) => {
      for (const t of TagDb.tags) {
        t.roomOrientationRotation = parseFloat(roomOrientationYSlider.value)
      }
      AppState.dataChanged = true
    })

    // set min / max roomOrientationYSlider values
    const roomOrientationXSlider = document.getElementById('roomOrientationXSlider')
    roomOrientationXSlider.attributes.min.value = -AppState.grid.width / 2
    roomOrientationXSlider.attributes.max.value = AppState.grid.width / 2
    roomOrientationXSlider.attributes.step.value = Units.toCm(0.5)
    roomOrientationXSlider.value = 0
    roomOrientationXSlider.addEventListener('input', (e) => {
      for (const t of TagDb.tags) {
        t.roomOrientationOffset.x = parseFloat(roomOrientationXSlider.value)
      }
      AppState.dataChanged = true
    })

    const roomOrientationZSlider = document.getElementById('roomOrientationZSlider')
    roomOrientationZSlider.attributes.min.value = -AppState.grid.depth / 2
    roomOrientationZSlider.attributes.max.value = AppState.grid.depth / 2
    roomOrientationZSlider.attributes.step.value = Units.toCm(0.5)
    roomOrientationZSlider.value = 0
    roomOrientationZSlider.addEventListener('input', (e) => {
      for (const t of TagDb.tags) {
        t.roomOrientationOffset.z = parseFloat(roomOrientationZSlider.value)
      }
      AppState.dataChanged = true
    })

    roomOrientationYSlider.disabled = true
    roomOrientationXSlider.disabled = true
    roomOrientationZSlider.disabled = true

    const roomHeightInput = document.getElementById('roomHeightInput')
    roomHeightInput.value = Units.fromCm(AppState.grid.height)
    roomHeightInput.addEventListener('input', (e) => {
      AppState.grid.height = Units.toCm(parseFloat(roomHeightInput.value))
    })

    const roomWidthInput = document.getElementById('roomWidthInput')
    roomWidthInput.value = Units.fromCm(AppState.grid.width)
    roomWidthInput.addEventListener('input', (e) => {
      AppState.grid.width = Units.toCm(parseFloat(roomWidthInput.value))
    })

    const roomDepthInput = document.getElementById('roomDepthInput')
    roomDepthInput.value = Units.fromCm(AppState.grid.depth)
    roomDepthInput.addEventListener('input', (e) => {
      AppState.grid.depth = Units.toCm(parseFloat(roomDepthInput.value))
    })

    const closeEnoughDistanceInput = document.getElementById('closeEnoughDistance')
    closeEnoughDistanceInput.value = AppState.closeEnoughDistance
    closeEnoughDistanceInput.addEventListener('input', (e) => {
      let newValue = parseInt(closeEnoughDistanceInput.value, 10)
      if (newValue < 4) {
        newValue = 4
      } else if (newValue > 100) {
        newValue = 100
      }
      closeEnoughDistanceInput.value = newValue
      AppState.closeEnoughDistance = parseInt(closeEnoughDistanceInput.value, 10)
    })

    AppState.toggleOverlayButton.button.addEventListener('click', () => {
      AppState.toggleOverlayButton.toggle()
      updateViewports()
    })

    const toggleUnitsButton = new ToggleButton('toggle-units', 'Units (m)', 'Units (ft)', 'fa-ruler', 'fa-ruler', false)
    toggleUnitsButton.state = true
    const toggleUnitsButtonClickHandler = () => {
      toggleUnitsButton.toggle()
      // set app state
      const prevUnits = Units.units
      Units.units = toggleUnitsButton.state ? 'm' : 'ft'

      // get elements by class
      const units = document.getElementsByClassName('units')
      for (const u of units) {
        u.innerText = `(${Units.units})`
      }

      // update the inputs to match
      // if current value is 6ft
      // 6ft = 18.288m
      if (prevUnits !== Units.units) {
        if (Units.units === 'm') {
          // convert ft to m
          roomHeightInput.value = Units.ftToCm(roomHeightInput.value) / 100
          roomDepthInput.value = Units.ftToCm(roomDepthInput.value) / 100
          roomWidthInput.value = Units.ftToCm(roomWidthInput.value) / 100
        } else {
          // convert m to ft
          roomHeightInput.value = Units.cmToFt(roomHeightInput.value * 100)
          roomDepthInput.value = Units.cmToFt(roomDepthInput.value * 100)
          roomWidthInput.value = Units.cmToFt(roomWidthInput.value * 100)
        }
      }
      AppState.grid.height = Units.toCm(parseFloat(roomHeightInput.value))
      AppState.grid.width = Units.toCm(parseFloat(roomWidthInput.value))
      AppState.grid.depth = Units.toCm(parseFloat(roomDepthInput.value))
    }
    toggleUnitsButton.button.addEventListener('click', toggleUnitsButtonClickHandler)
    toggleUnitsButtonClickHandler()

    setupScenario()
    sketch.resizeCanvas(AppState.viewport.width, AppState.viewport.height)
  }

  // Mouse Event Handlers
  //
  let touchDelta = 0
  sketch.mousePressed = () => {
    let t = getMousePressedTag()
    if (sketch.mouseButton === sketch.RIGHT) {
      if (t) {
        if (t.role === 'fixed') {
          t.role = 'mobile'
        } else {
          t.role = 'fixed'
        }
      }
    } else if (sketch.mouseButton === sketch.LEFT) {
      // check to see if a tag was clicked in the 3D view
      if (t == null) {
        t = getMousePressedTag3d()
      }
      selectedTag = t
    }
    AppState.dataChanged = true
  }

  const getMousePressedTag3d = () => {
    const mx = sketch.mouseX - (AppState.viewport3d.width / 2)
    const my = sketch.mouseY - (AppState.viewport3d.height / 2)
    for (const t of TagDb.tags) {
      const p = AppState.buffer3d.screenPosition(t.getX(), t.getY() + AppState.cameraYShift, t.getZ())
      const dist = Units.distance(p.x, p.y, mx, my)
      if (dist < t.radius) {
        selectView = '3D'
        return t
      }
    }
    return null
  }

  sketch.mouseDragged = () => {
    if (sketch.touches.length === 2) {
      const tempDelta = Math.abs(sketch.touches[0].y - sketch.touches[1].y)
      sketch.mouseWheel({
        delta: tempDelta > touchDelta ? -1 : 1
      })
      touchDelta = Math.abs(sketch.touches[0].y - sketch.touches[1].y)
    } else {
      if (selectedTag) {
        return updateSelectedTag()
      }

      // Send the mouse coordinates
      if (AppState.viewMode === '3D') {
        if (sketch.mouseX > AppState.viewport3d.x && sketch.mouseX < AppState.viewport3d.width && sketch.mouseY > AppState.viewport3d.y && sketch.mouseY < AppState.viewport3d.height) {
          updateOrbitCam()
          TagDb.depthSort(cam)
        }
      }
    }
  }

  sketch.mouseReleased = () => {
    selectedTag = null
  }

  sketch.mouseMoved = () => {
    AppState.dataChanged = true
  }

  const orbitSensitivityZ = 0.15
  const orbitScaleFactor = 125
  sketch.mouseWheel = (event) => {
    if (AppState.viewMode === '2D') {
      if (event.delta > 0 && (zoom2d - (0.05 * orbitSensitivityZ)) > 0.1) {
        zoom2d -= 0.05 * orbitSensitivityZ
      } else if (event.delta < 0 && zoom2d < 2) {
        zoom2d += 0.05 * orbitSensitivityZ
      }
      AppState.dataChanged = true
    } else if (AppState.viewMode === '3D') {
      updateOrbitCam()
      const camDist = cam.eyeX * cam.eyeX + cam.eyeY * cam.eyeY + cam.eyeZ * cam.eyeZ
      zoomFactor = (Math.sqrt(camDist) - 180) / 180
      if (zoomFactor < 3)zoomFactor = 3

      if (event.delta > 0) {
        if (camDist < 20000000) {
          cam._orbit(0, 0, orbitSensitivityZ * orbitScaleFactor)
        }
      } else {
        if (camDist > 40000) {
          cam._orbit(0, 0, -orbitSensitivityZ * orbitScaleFactor)
        }
      }
    }
  }
  // End Mouse Event Handlers

  sketch.windowResized = () => {
    updateViewports()
    sketch.resizeCanvas(AppState.viewport.width, AppState.viewport.height)

    const result = setupBuffer3d()
    AppState.buffer3d.remove()
    AppState.buffer3d = result.buffer3d
    addScreenPositionFunction(AppState.buffer3d)
    AppState.gl = result.gl
    cam = result.cam

    updateOrbitCam()
    AppState.grid.viewportMenu = AppState.viewportMenu
    AppState.dataChanged = true
  }

  // Other Helper Functions
  //
  let tagPositionUpdateTimer
  function setupScenario () {
    TagDb.clear()
    zoom2d = 1.0

    if (tagPositionUpdateTimer) {
      clearInterval(tagPositionUpdateTimer)
    }

    tagPositionUpdateTimer = setInterval(() => {
      // Update position of tags
      TagScene.updateTagPositions()
      AppState.dataChanged = true
    }, 50)
    TagDb.depthSort(cam)
  }

  let selectView = 'Top'
  const updateSelectedTag = () => {
    // check if a tag has been clicked
    if (selectedTag != null) {
      AppState.dataChanged = true
      // update the position of the tag
      if (AppState.viewMode === '2D') {
        if (sketch.mouseX < AppState.viewport3d.x || sketch.mouseX >= (AppState.viewport3d.x + AppState.viewport3d.width) || sketch.mouseY < AppState.viewport3d.y || sketch.mouseY >= (AppState.viewport3d.y + AppState.viewport3d.height)) { return }

        selectedTag.position.x = (sketch.mouseX - AppState.viewport3d.width / 2) / zoom2d
        selectedTag.position.y = (sketch.mouseY - AppState.viewport3d.height / 2) / zoom2d

        if (sketch.keyIsDown(sketch.SHIFT)) {
          selectedTag.position.x = Math.round(selectedTag.position.x / Units.toCm(0.5)) * Units.toCm(0.5)
          selectedTag.position.y = Math.round(selectedTag.position.y / Units.toCm(0.5)) * Units.toCm(0.5)
        }
      } else if (AppState.viewMode === '3D') {
        if (selectView === 'Top') {
          if (sketch.mouseX < (AppState.viewportMenu.x + AppState.grid.topGrid.x) || sketch.mouseX > (AppState.viewportMenu.x + AppState.grid.topGrid.x + AppState.grid.topGrid.xextent) ||
            sketch.mouseY < (AppState.viewportMenu.y + AppState.grid.topGrid.y) || sketch.mouseY > (AppState.viewportMenu.y + AppState.grid.topGrid.y + AppState.grid.topGrid.yextent)) {
            return
          }
        } else if (selectView === 'Front') {
          if (sketch.mouseX < (AppState.viewportMenu.x + AppState.grid.frontGrid.x) || sketch.mouseX > (AppState.viewportMenu.x + AppState.grid.frontGrid.x + AppState.grid.frontGrid.xextent) ||
            sketch.mouseY < (AppState.viewportMenu.y + AppState.grid.frontGrid.y) || sketch.mouseY > (AppState.viewportMenu.y + AppState.grid.frontGrid.y + AppState.grid.frontGrid.yextent)) {
            return
          }
        }

        if (selectView === 'Top') {
          TagDb.depthSort(cam)
        } else if (selectView === 'Front') {
          // Only allow for position adjustment on the Y axis of fixed/anchor tags to set the height
          selectedTag.position.y = (sketch.mouseY - AppState.viewportMenu.y - AppState.grid.frontGrid.y - AppState.grid.frontGrid.yextent / 2) / AppState.grid.frontviewScale
          TagDb.depthSort(cam)
        } else if (selectView === '3D') {
          // selected from the 3D view
          selectedTag.position.y += ((sketch.mouseY - sketch.pmouseY) / 2)
          TagDb.depthSort(cam)
        }

        if (sketch.keyIsDown(sketch.SHIFT)) {
          if (selectedTag.role === 'fixed') {
            selectedTag.position.y = Math.round(selectedTag.position.y / Units.toCm(0.5)) * Units.toCm(0.5)
          }
          TagDb.depthSort(cam)
        }
      }
    }
  }

  const getMousePressedTag = () => {
    const grid = AppState.grid
    if (AppState.viewMode === '3D') {
      let dist
      for (const t of TagDb.tags) {
        dist = Units.distance(sketch.mouseX - AppState.viewportMenu.x - grid.topGrid.x - grid.topGrid.xextent / 2, sketch.mouseY - AppState.viewportMenu.y - grid.topGrid.y - grid.topGrid.yextent / 2, t.getX() * grid.topviewScale, t.getZ() * grid.topviewScale)
        if (dist < t.radius * grid.topviewScale) {
          selectView = 'Top'
          return t
        }

        dist = Units.distance(sketch.mouseX - AppState.viewportMenu.x - grid.frontGrid.x - grid.frontGrid.xextent / 2, sketch.mouseY - AppState.viewportMenu.y - grid.frontGrid.y - grid.frontGrid.yextent / 2, t.getX() * grid.frontviewScale, t.getY() * grid.topviewScale)
        if (dist < t.radius * grid.topviewScale) {
          selectView = 'Front'
          return t
        }
      }
    }
    return null
  }
}

const myp5 = new p5(s) // eslint-disable-line no-unused-vars, new-cap

// recieve events from the backend
const eventListenerHandler = (data) => {
  // if (!AppState.scanButton.state) return
  if (!AppState.scanButton.state && !AppState.scanStopping) {
      AppState.scanButton.setOn()
  }
  if (AppState.scanButton.state) {
    TagScene.handleAd(data.params)
  }
}

xbit.addEventListener('bluetoothDeviceDiscovered', eventListenerHandler)

window.onunload = () => {
  xbit.removeEventListener(eventListenerHandler)
}
