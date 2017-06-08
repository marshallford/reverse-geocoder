import _ from 'lodash'
import winston from 'winston'
import config from '~/config'
import { latlng, providers } from '~/utils'
import pg from 'pg'

const pgProvider = (name, provider, input) => {
  if (config.log > 1) winston.info(`${name}: ${latlng(input.lat, input.lng)}`)
  const sql = provider.sql(input.lat, input.lng)
  return dbs[name].query(sql.query, sql.params)
    .then((response) => {
      // on a "good" response set result based on provider's defined path
      const result = _.get(response, provider.path)
      // get extra data if possible
      let extras = {}
      if (!provider.extrasPath || !provider.extras) {
        if (config.log > 1) winston.info(`${name}: missing config options for extras`)
      } else {
        extras = provider.extras(_.get(response, provider.extrasPath))
      }

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
      return {
        output: result,
        extras,
      }
    })
    .catch((err) => {
      if (err.providerError) {
        throw new Error(err.providerError)
      }
      const error = `${name}: could not connect to provider`
      if (config.log > 1) winston.info(error)
      throw new Error(error)
    })
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
      winston.error('idle client error', err.message, err.stack)
    })
  }
)

export { dbs }
export default pgProvider
