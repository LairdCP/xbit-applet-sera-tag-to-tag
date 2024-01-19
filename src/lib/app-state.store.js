export default class {
  static displayFont = null
  static buffer3d = null
  static viewMode = '3D'
  static selectedScenario = '2D/3D Position w/Tags'
  static alertText = ''
  static overlayTextSize = 24
  static showRemoteDistances = false
  static sphereSolutionOption = 'one'
  static sketch = null
  static mobileTagIntersections = {} // used for 3D positioning
  static closeEnoughDistance = 5 // cm
  static scanStopping = false
  static dataChanged = false
  static tagsAboveAnchors = false
  static grid = null
  static showRangeSpheres = false
  static cameraYShift = -100
  static sphereSolution = (o) => {
    return this.sphereSolutionOption === o || this.sphereSolutionOption === 'both'
  }
}
