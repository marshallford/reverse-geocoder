import config from '~/config'

const latlng = (lat, lng) => `${lat},${lng}`

const truncate = (strNumber, truncate = config.truncate || 2) => {
  if (strNumber.indexOf('.') > 0) {
    const decimalLength = strNumber.slice(strNumber.indexOf('.'), strNumber.length - 1).length
    if (decimalLength < truncate) {
      strNumber += '0'.repeat(truncate - decimalLength)
    }
    return strNumber.slice(0, (strNumber.indexOf('.')) + truncate + 1)
  }
  return strNumber
}

export { latlng, truncate }
