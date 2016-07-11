import _ from 'lodash'
import winston from 'winston'
import config from '~/config'
import { latlng } from '~/utils'

const pgProvider = (name, provider, input, db) => {
  if (config.log > 1) winston.info(`${name}: ${latlng(input.lat, input.lng)}`)
  return db.one(provider.query, [input.lat, input.lng])
    .then((response) => {
      // on a "good" response set result based on provider's defined path
      const result = _.get(response, provider.path)
      // if the result is empty assume either the provider path isn't valid or the provider responded "nicely" with bad data
      if (!result) {
        const e = new Error()
        e.providerError = `${name}: not a valid provider path or no data available`
        if (config.log > 1) winston.info(e.providerError)
        throw e
      }
      // if a failure key does not exist or is empty, fail
      if (provider.failures) {
        provider.failures.forEach((failure) => {
          if (!_.get(response, failure)) {
            const e = new Error()
            e.providerError = `${name}: data contains failure condition, passing over result`
            if (config.log > 1) winston.info(e.providerError)
            throw e
          }
        })
      }
      if (config.log > 1) winston.info(`${name}: success (${result})`)
      return result
    })
    .catch((response) => {
      if (response.providerError) {
        throw new Error(response.providerError)
      }
      const error = `${name}: could not connect to provider`
      if (config.log > 1) winston.info(error)
      throw new Error(error)
    })
}

export default pgProvider
