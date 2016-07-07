import _ from 'lodash'
import axios from 'axios'

const httpProvider = (name, provider, input) => {
  return axios.get(provider.url(input.lat, input.lng, provider.key), { timeout: provider.timeout })
    .then((response) => {
      // on a "good" response set result based on provider's defined path
      const result = _.get(response, provider.path)
      // if the result is empty assume either the provider path isn't valid or the provider responded "nicely" with bad data
      if (!result) {
        const e = new Error()
        e.providerError = `${name}: not a valid provider path or no data available`
        throw e
      }
      // if a failure key does not exist or is empty, fail
      if (provider.failures) {
        provider.failures.forEach((failure) => {
          if (!_.get(response, failure)) {
            const e = new Error()
            e.providerError = `${name}: data contains failure condition, passing over result`
            throw e
          }
        })
      }
      return result
    })
    .catch((response) => {
      if (response.providerError) {
        throw new Error(response.providerError)
      }
      throw new Error(`${name}: could not connect to provider`)
    })
}

export default httpProvider
