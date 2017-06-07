import _ from 'lodash'
import config from '~/config'

const latlng = (lat, lng) => `${lat},${lng}`

const latlngValidator = (body) => {
  // request body should include a lat and lng key
  if (body.lat == null || body.lng == null) {
    throw new Error('lat and lng value required')
  }
  // lat and lng should be numbers
  if (!_.isNumber(body.lat) || !_.isNumber(body.lng)) {
    throw new Error('lat and lng must be numbers')
  }
  // clean up lat and lng values
  return {
    lat: truncate(body.lat),
    lng: truncate(body.lng),
  }
}

// truncates number to provided number of decimal places, no rounding
// example: truncate(1.259, 2) --> 1.25
const truncate = (number, truncate = config.truncate || 2) => {
  number = number.toString()
  if (number.indexOf('.') > 0) {
    return _.toNumber(number.slice(0, (number.indexOf('.')) + truncate + 1))
  }
  return _.toNumber(number)
}

const toBoolean = (input, truthy = ['true', 'yes', 'on']) => {
  if (typeof (input) === 'boolean') {
    return input
  } else if (input === undefined || input === null) {
    return false
  } else if (truthy.includes(input.toString().trim().toLowerCase())) {
    return true
  } else {
    return false
  }
}

// get list of providers to use
const providers = Object.keys(config.providers)
  .filter(provider => config.providers[provider].priority > 0)
  .sort((x, y) => config.providers[x].priority - config.providers[y].priority)
  .map(provider => provider)

export { latlng, latlngValidator, truncate, toBoolean, providers }
