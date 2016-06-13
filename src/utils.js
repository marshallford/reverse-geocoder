import _ from 'lodash'
import config from '~/config'

const latlng = (lat, lng) => `${lat},${lng}`

const truncate = (strNumber, truncate = config.truncate || 2) => {
  strNumber = strNumber.toString()
  if (strNumber.indexOf('.') > 0) {
    return _.toNumber(strNumber.slice(0, (strNumber.indexOf('.')) + truncate + 1))
  }
  return _.toNumber(strNumber)
}

export { latlng, truncate }
