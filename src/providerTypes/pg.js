import _ from 'lodash'
import winston from 'winston'
import config from '~/config'
import { latlng, providers, ProviderError } from '~/utils'
import pg from 'pg'

const pgProvider = async (name, provider, input) => {
  if (config.log > 1) winston.info(`${name}: ${latlng(input.lat, input.lng)}`)

  // get response
  let response
  try {
    const sql = provider.sql(input.lat, input.lng)
    response = await dbs[name].query(sql.query, sql.params)
  } catch (err) {
    const msg = `${name}: could not connect to provider`
    if (config.log > 1) winston.info(msg)
    throw new ProviderError(msg)
  }

  // if the result is empty assume either the provider path isn't valid or the provider responded "nicely" with bad data
  const result = _.get(response, provider.path)
  if (!result) {
    const msg = `${name}: not a valid provider path or no data available`
    if (config.log > 1) winston.info(msg)
    throw new ProviderError(msg)
  }

  // get extra data if possible
  let extras = {}
  if (!provider.extrasPath || !provider.extras) {
    if (config.log > 1) winston.info(`${name}: missing config options for extras`)
  } else {
    extras = provider.extras(_.get(response, provider.extrasPath))
  }

  // if a failure key does not exist or is empty, fail
  if (provider.failures) {
    provider.failures.forEach((failure) => {
      if (!_.get(response, failure)) {
        const msg = `${name}: data contains failure condition, passing over result`
        if (config.log > 1) winston.info(msg)
        throw ProviderError(msg)
      }
    })
  }

  // success
  if (config.log > 1) winston.info(`${name}: (${JSON.stringify(result, null, 2)})`)
  return {
    output: result,
    extras,
  }
}

// define postgres databases based on provider's config
const dbs = {}
providers
  .filter(providerName => config.providers[providerName].type === 'pg')
  .forEach(providerName => {
    dbs[providerName] = new pg.Pool({ max: 1, ..._.pick(config.providers[providerName], ['host', 'port', 'database', 'user', 'password']) })
    dbs[providerName].on('error', (err, client) => {
      // if an error is encountered by a client while it sits idle in the pool
      // the pool itself will emit an error event with both the error and
      // the client which emitted the original error
      // this is a rare occurrence but can happen if there is a network partition
      // between your application and the database, the database restarts, etc.
      // and so you might want to handle it and at least log it out
      winston.error('idle pg client error', err.message, err.stack)
    })
  }
)

export { dbs }
export default pgProvider
