import { Units } from './units.js'

export class TagDb {
  static tagsFound = []
  static tags = []
  static lockedAnchors = []

  static clear () {
    TagDb.tags = []
    TagDb.tagsFound = []
  }

  static depthSort (cam) {
    TagDb.tags.sort((a, b) => {
      const camPos = { x: cam.eyeX, y: cam.eyeY, z: cam.eyeZ }
      if (Units.distance3d(camPos, a.position) < Units.distance3d(camPos, b.position)) {
        return 1
      } else {
        return -1
      }
    })
  }

  static getTagByShortAddress (shortAddressString) {
    for (let i = 0; i < TagDb.tags.length; i++) {
      if (TagDb.tags[i].shortAddr) {
        if (TagDb.tags[i].shortAddr === shortAddressString) {
          return TagDb.tags[i]
        }
      }
    }
    return null
  }

  static isSensorFound (deviceId) {
    for (const s of TagDb.tagsFound) {
      if (s.deviceId === deviceId) {
        return true
      }
    }
    return false
  }

  static updateSensorLastSeen (deviceId) {
    for (const s of TagDb.tagsFound) {
      if (s.deviceId === deviceId) {
        s.lastSeen = Date.now()
        return
      }
    }
  }

  static unlockAnchors () {
    if (TagDb.lockedAnchors.length === 0) {
      return
    }
    for (const t of TagDb.lockedAnchors) {
      t.role = 'mobile'
    }
  }

  static lockAnchors () {
    // keep track of this list for future calls to unlockAnchors/lockAnchors
    if (TagDb.lockedAnchors.length === 0) {
      for (const t of TagDb.tags) {
        TagDb.lockedAnchors.push(t)
        t.role = 'fixed'
      }
    } else {
      for (const t of TagDb.lockedAnchors) {
        t.role = 'fixed'
      }
    }
  }

  static removeUnseenSensors () {
    const tagsToRemove = []
    const now = Date.now()
    for (const t of TagDb.tags) {
      if ((now - t.lastSeen) > 30000) {
        tagsToRemove.push(t)
      }
    }
    for (const tr of tagsToRemove) {
      const idx = TagDb.tags.indexOf(tr)
      TagDb.tags.splice(idx, 1)
    }
  }
}
