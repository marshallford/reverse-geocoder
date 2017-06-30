import _ from 'lodash'
import axios from 'axios'
import logger from '~/logger'
import { latlng, ProviderError } from '~/utils'

const httpProvider = async (name, provider, input) => {
  logger.debug(`${name}: ${latlng(input.lat, input.lng)}`)

  // get response
  let response
  try {
    response = await axios.get(provider.url(input.lat, input.lng, provider.key), { timeout: provider.timeout })
  } catch (err) {
    const msg = `${name}: could not connect to provider`
    logger.debug(msg)
    throw new ProviderError(msg)
  }

  // if the result is empty assume either the provider path isn't valid or the provider responded "nicely" with bad data
  const result = _.get(response, provider.path)
  if (!result) {
    const msg = `${name}: not a valid provider path or no data available`
    logger.debug(msg)
    throw new ProviderError(msg)
  }

  // get extra data if possible
  let extras = {}
  if (!provider.extrasPath || !provider.extras) {
    logger.debug(`${name}: missing config options for extras`)
  } else {
    extras = provider.extras(_.get(response, provider.extrasPath))
  }

  // if a failure key does not exist or is empty, fail
  if (provider.failures) {
    provider.failures.forEach((failure) => {
      if (!_.get(response, failure)) {
        const msg = `${name}: data contains failure condition, passing over result`
        logger.debug(msg)
        throw ProviderError(msg)
      }
    })
  }

  // success
  logger.debug(`${name}: (${JSON.stringify(result, null, 2)})`)
  return {
    output: result,
    extras,
  }
}

export default httpProvider
