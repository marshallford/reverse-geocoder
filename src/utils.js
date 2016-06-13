import _ from 'lodash'
import config from '~/config'

const latlng = (lat, lng) => `${lat},${lng}`

// truncates number to provided number of decimal places, no rounding
// example: truncate(1.259, 2) --> 1.25
const truncate = (number, truncate = config.truncate || 2) => {
  number = number.toString()
  if (number.indexOf('.') > 0) {
    return _.toNumber(number.slice(0, (number.indexOf('.')) + truncate + 1))
  }
  return _.toNumber(number)
}

export { latlng, truncate }
