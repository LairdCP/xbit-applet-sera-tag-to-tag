// Manage adding, removing, and updating tags in the scene
//

import { Ble } from './ble.js'
import { Tag } from './tag.class.js'
import { TagDb } from './tag-db.js'
import { Units } from './units.js'
import AppState from './app-state.store.js'
import { bytesToHex, parseManufacturerData, parseLtvs, hasLtv } from '@bennybtl/xbit-lib'

export default {
  addMobileTag,
  updateMobileTag,
  updateTagPositions,
  handleAd
}

export function handleAd ({ deviceAddress, ad }) {
  if (ad) {
    const hexAd = bytesToHex(ad)
    const ltvMap = parseLtvs(hexAd)
    let parsedAd = null

    try {
      if (ltvMap.ff) {
        parseManufacturerData(ltvMap.ff).forEach((data) => {
          parsedAd = Object.assign(parsedAd || {}, data)
        })
      }
    } catch (e) {
      // console.log(e)
    }

    // Check for Laird mfg id and BT510 tilt sensor protocol ID (0xc9)
    const ffLtv = hasLtv('ff', [0x77, 0x00, 0x0c, 0x00], ltvMap)
    if (ffLtv) {
      let tag
      // Check to see if this is a new UWB tag
      if (!deviceAddress) return
      // if (deviceAddress.length > 13) {
      //   deviceAddress = deviceAddress.substr(2, 12)
      // } else {
      //   return
      // }

      const now = Date.now()
      if (!TagDb.isSensorFound(deviceAddress)) {
        TagDb.tagsFound.push({ deviceAddress, lastSeen: now })

        const tagPos = { x: Math.sin((Math.PI / 2) + (20 * Math.PI / (TagDb.tagsFound.length + 1))) * Units.toCm(6), y: 5, z: Math.cos((Math.PI / 2) + (20 * Math.PI / (TagDb.tagsFound.length + 1))) * Units.toCm(6) }
        tag = addMobileTag(deviceAddress)
        // tag.setColorIndex(TagDb.tags.length - 1);
        tag.setColorIndex(3)
        tag.position = tagPos
        updateMobileTag(deviceAddress, ffLtv)
        console.log('Added tag [' + tag.shortAddr + '] [BLE: ' + deviceAddress + '] [ID:' + bytesToHex(tag.longAddr) + ']')
      } else {
        updateMobileTag(deviceAddress, ffLtv)
        TagDb.updateSensorLastSeen(deviceAddress)
      }
      // TODO: update the database from this ad
    }
  }
}

const defaultTagRadius = Units.toCm(0.5)
function addMobileTag (deviceAddress) {
  const tag = new Tag(String.fromCharCode('A'.charCodeAt(0) + TagDb.tags.length),
    { x: 50, y: 50, z: 0 }, defaultTagRadius, 'mobile', 3)
  if (deviceAddress) {
    tag.deviceAddress = deviceAddress
  }
  TagDb.tags.push(tag)
  AppState.dataChanged = true
  return tag
}

function updateMobileTag (deviceAddress, ffLtv) {
  let tag = null
  for (let i = 0; i < TagDb.tags.length; i++) {
    if (TagDb.tags[i].deviceAddress === deviceAddress) {
      tag = TagDb.tags[i]
      break
    }
  }
  if (!tag) return
  const v = ffLtv

  if (!tag.longAddr) {
    tag.longAddr = []
    for (let i = 8; i < 16; i++) {
      tag.longAddr.push(v[i])
    }
    tag.shortAddr = bytesToHex(tag.longAddr).substring(12)
  }

  // parse the ranging records starting at byte 20
  const records = []
  for (let i = 20; i < v.length;) {
    const record = {}
    record.type = v[i]
    i++
    record.len = v[i]
    i++
    record.bytes = []
    for (let j = i; j < (i + record.len); j++) {
      record.bytes.push(v[j])
    }
    i += record.len
    if (record.len <= 0) {
      break
    }
    records.push(record)
  }

  for (let i = 0; i < records.length; i++) {
    let dist
    switch (records[i].type) {
      case 0: // ranging record type
        dist = (records[i].bytes[2] << 8) | records[i].bytes[3]
        if (dist !== 65535) {
          tag.addRange(bytesToHex([records[i].bytes[0], records[i].bytes[1]]), dist)
        }
        break
      case 10: // LED color type
        tag.setColorRgb((records[i].bytes[0] * 10) % 255, (records[i].bytes[1] * 10) % 255, (records[i].bytes[2] * 10) % 255)
        break
      default:
        break
    }
  }
}

export function updateTagPositions () {
  let allMobile = true
  let fixedTagCount = 0

  for (const t of TagDb.tags) {
    if (t.role === 'fixed') {
      fixedTagCount++
    }
    if (t.role !== 'mobile') {
      allMobile = false
    }
  }

  // Now that we have the target distances between each node, iterate the nodes
  if (allMobile) {
    let d
    let measuredDist
    for (let i = 0; i < TagDb.tags.length; i++) {
      for (let j = 0; j < TagDb.tags.length; j++) {
        if (i === j) continue
        // if (TagDb.tags[i].role === 'fixed') continue
        measuredDist = Units.getDistanceBetweenTags(TagDb.tags[i], TagDb.tags[j], true)
        if (isNaN(measuredDist)) continue

        d = Units.distance(TagDb.tags[i].position.x, TagDb.tags[i].position.z, TagDb.tags[j].position.x, TagDb.tags[j].position.z)
        if (!TagDb.tags[i].position || !TagDb.tags[j].position) { console.log('missing a pos'); continue }
        // console.log(TagDb.tags[i].name + ' to ' + TagDb.tags[j].name + ': ' + measuredDist, d, AppState.closeEnoughDistance)
        if (Math.abs(d - measuredDist) < AppState.closeEnoughDistance) continue

        if (measuredDist > d) {
          if (TagDb.tags[j].position.x > TagDb.tags[i].position.x) {
            // TagDb.tags[i].position.x -= d / 20;
            TagDb.tags[i].position.x--
          } else {
            // TagDb.tags[i].position.x += d / 20;
            TagDb.tags[i].position.x++
          }
          if (TagDb.tags[j].position.z > TagDb.tags[i].position.z) {
            // TagDb.tags[i].position.z -= d / 20;
            TagDb.tags[i].position.z--
          } else {
            // TagDb.tags[i].position.z += d / 20;
            TagDb.tags[i].position.z++
          }
        } else {
          if (TagDb.tags[j].position.x > TagDb.tags[i].position.x) {
            // TagDb.tags[i].position.x += d / 20;
            TagDb.tags[i].position.x++
          } else {
            // TagDb.tags[i].position.x -= d / 20;
            TagDb.tags[i].position.x--
          }
          if (TagDb.tags[j].position.z > TagDb.tags[i].position.z) {
            // TagDb.tags[i].position.z += d / 20;
            TagDb.tags[i].position.z++
          } else {
            // TagDb.tags[i].position.z -= d / 20;
            TagDb.tags[i].position.z--
          }
        }
      }
    }

    // Now, if all tags are mobile, attempt to keep them in the center of the view
    if (TagDb.tags.length > 0) {
      let centerX = 0
      let centerZ = 0
      for (let i = 0; i < TagDb.tags.length; i++) {
        centerX += TagDb.tags[i].position.x
        centerZ += TagDb.tags[i].position.z
      }
      centerX /= TagDb.tags.length
      centerZ /= TagDb.tags.length

      for (const t of TagDb.tags) {
        if (t.role !== 'fixed') {
          t.position.x -= centerX
          t.position.z -= centerZ
        }
      }
    }
  } else {
    // If we have some fixed tags, position the mobile tags using the fixed tags
    // TODO: add support for 2 fixed tag scenario
    if (fixedTagCount === 2) {
      // For each mobile tag, find the distance from each fixed tag and use circle/circle intersection to assign its position
      const fixedTags = []
      for (const t of TagDb.tags) {
        if (t.role === 'fixed') {
          fixedTags.push(t)
        }
      }

      for (const t of TagDb.tags) {
        if (t.role === 'mobile') {
          // find the range from this mobile tag to this fixed tag
          const intersectionPoints = Units.circle_circle_intersection(
            fixedTags[0].getX(), fixedTags[0].getZ(), Units.getDistanceBetweenTags(t, fixedTags[0], false),
            fixedTags[1].getX(), fixedTags[1].getZ(), Units.getDistanceBetweenTags(t, fixedTags[1], false))
          if (intersectionPoints && intersectionPoints.length === 2 && !isNaN(intersectionPoints[0].x) && !isNaN(intersectionPoints[0].y) && !isNaN(intersectionPoints[1].x) && !isNaN(intersectionPoints[1].y)) {
            AppState.alertText = ''
            if (AppState.tagsBelowAnchors) {
              if (intersectionPoints[0].x > intersectionPoints[1].x) {
                t.position.x = intersectionPoints[0].x
                t.position.y = fixedTags[0].getY()
                t.position.z = intersectionPoints[0].y
              } else {
                t.position.x = intersectionPoints[1].x
                t.position.y = fixedTags[0].getY()
                t.position.z = intersectionPoints[1].y
              }
            } else {
              if (intersectionPoints[0].x < intersectionPoints[1].x) {
                t.position.x = intersectionPoints[0].x
                t.position.y = fixedTags[0].getY()
                t.position.z = intersectionPoints[0].y
              } else {
                t.position.x = intersectionPoints[1].x
                t.position.y = fixedTags[0].getY()
                t.position.z = intersectionPoints[1].y
              }
            }
          } else {
            AppState.alertText = '2D Positioning Error'
          }
        }
      }
    } else if (fixedTagCount === 3) {
      // For each mobile tag, find the distance from each fixed tag and use sphere/sphere/sphere intersection to assign its position
      const fixedTags = []
      for (const t of TagDb.tags) {
        if (t.role === 'fixed') {
          fixedTags.push(t)
        }
      }
      for (const t of TagDb.tags) {
        if (t.role === 'mobile') {
          // find the range from this mobile tag to this fixed tag
          const intersectionPoints = Units.intersect3spheres(
            fixedTags[0].getX(), fixedTags[1].getX(), fixedTags[2].getX(),
            fixedTags[0].getY(), fixedTags[1].getY(), fixedTags[2].getY(),
            fixedTags[0].getZ(), fixedTags[1].getZ(), fixedTags[2].getZ(),
            Units.getDistanceBetweenTags(t, fixedTags[0], false),
            Units.getDistanceBetweenTags(t, fixedTags[1], false),
            Units.getDistanceBetweenTags(t, fixedTags[2], false)
          )
          // console.log(intersectionPoints);
          if (!isNaN(intersectionPoints[0]) && !isNaN(intersectionPoints[1]) && !isNaN(intersectionPoints[2])) {
            AppState.alertText = ''
            if (AppState.tagsBelowAnchors) {
              if (intersectionPoints[1] > intersectionPoints[4]) {
                t.position.x = intersectionPoints[0]
                t.position.y = intersectionPoints[1]
                t.position.z = intersectionPoints[2]
              } else {
                t.position.x = intersectionPoints[3]
                t.position.y = intersectionPoints[4]
                t.position.z = intersectionPoints[5]
              }
            } else {
              if (intersectionPoints[1] < intersectionPoints[4]) {
                t.position.x = intersectionPoints[0]
                t.position.y = intersectionPoints[1]
                t.position.z = intersectionPoints[2]
              } else {
                t.position.x = intersectionPoints[3]
                t.position.y = intersectionPoints[4]
                t.position.z = intersectionPoints[5]
              }
            }

            const mobileTagIntersection = {
              tag: t,
              intersectionPoints
            }
            AppState.mobileTagIntersections[t.name] = mobileTagIntersection
          } else {
            AppState.alertText = '3D Positioning Error: Hold the reset button on mobile tags for 10 seconds if this error persists.'
          }
        }
      }
    }
  }
  AppState.dataChanged = true
}
