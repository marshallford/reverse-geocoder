import _ from 'lodash'
import axios from 'axios'
import config from '~/config'

const httpProvider = (name, provider, input) => {
  if (config.log) console.log(`${name} running...`)
  return axios.get(provider.url(input.lat, input.lng, provider.key))
    .then((response) => {
      // on a "good" response set result based on provider's defined path
      const result = _.get(response, provider.path)
      // if the result is empty assume either the provider path isn't valid or the provider responded "nicely" with bad data
      if (!result) {
        throw new Error(`${name}: not a valid provider path or lat/lng`)
      }
      return result
    })
    .catch((response) => {
      // on "bad" response, tell the client
      throw new Error(`${name}: could not connect to provider`)
    })
}

export default httpProvider