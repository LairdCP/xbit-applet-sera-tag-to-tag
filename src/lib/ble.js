export class Ble {
  static getValFromAdString (key, vals) {
    for (const v of vals) {
      if (v.startsWith(key)) {
        return v.substring(key.length + 1)
      }
    }
    return null
  }
}
