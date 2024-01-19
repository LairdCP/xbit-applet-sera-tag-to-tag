import { Units } from './units.js'

export class TagDb {
  static tagsFound = []
  static tags = []

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

  static isSensorFound (deviceAddress) {
    for (const s of TagDb.tagsFound) {
      if (s.deviceAddress === deviceAddress) {
        return true
      }
    }
    return false
  }

  static updateSensorLastSeen (deviceAddress) {
    for (const s of TagDb.tagsFound) {
      if (s.deviceAddress === deviceAddress) {
        s.lastSeen = Date.now()
        return
      }
    }
  }

  static getSensorLastSeenSinceNow (deviceAddress) {
    for (const s of TagDb.tagsFound) {
      if (s.deviceAddress === deviceAddress) {
        return Date.now() - s.lastSeen
      }
    }
    // return maximum JavaScript integer value
    return Number.MAX_SAFE_INTEGER
  }

  static tagsLastRanged (t1, t2) {
    let lastSeen = Number.MAX_SAFE_INTEGER
    for (const k of Object.keys(t1.rangeDb)) {
      if (k === t2.shortAddr) {
        const ls = Date.now() - t1.rangeLastSeenDb[k]
        if (ls < lastSeen) {
          lastSeen = ls
        }
      }
    }
    for (const k of Object.keys(t2.rangeDb)) {
      if (k === t1.shortAddr) {
        const ls = Date.now() - t2.rangeLastSeenDb[k]
        if (ls < lastSeen) {
          lastSeen = ls
        }
      }
    }
    return lastSeen
  }

  static unlockAnchors () {
    const tagsToRemove = []
    for (const t of TagDb.tags) {
      if (t.role === 'fixed') {
        t.locked = false
      } else if (t.role === 'mobile') {
        tagsToRemove.push(t)
      }
    }
    for (const tr of tagsToRemove) {
      TagDb.removeTag(tr)
    }
  }

  static lockAnchors () {
    // keep track of this list for future calls to unlockAnchors/lockAnchors
    for (const t of TagDb.tags) {
      if (t.role === 'fixed') {
        t.locked = true
      }
    }
  }

  static removeTag (tag) {
    const idx = TagDb.tags.indexOf(tag)
    if (idx > -1) {
      TagDb.tags.splice(idx, 1)
    }
    for (let i = 0; i < TagDb.tagsFound.length; i++) {
      if (TagDb.tagsFound[i].deviceAddress === tag.deviceAddress) {
        TagDb.tagsFound.splice(i, 1)
        break
      }
    }
  }

  static removeUnseenSensors () {
    const tagsToRemove = []
    const now = Date.now()
    for (const t of TagDb.tagsFound) {
      if ((now - t.lastSeen) > 10000) {
        for (const tg of TagDb.tags) {
          if (tg.deviceAddress === t.deviceAddress) {
            if (tg.role === 'mobile') {
              tagsToRemove.push(tg)
            }
            break
          }
        }
      }
    }

    for (const tr of tagsToRemove) {
      TagDb.removeTag(tr)
    }
  }
}
