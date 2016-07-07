import { Router } from 'express'
import { RateLimiter } from 'limiter'
import _ from 'lodash'
import moment from 'moment'
import pgpModule from 'pg-promise'
const pgp = pgpModule()
import { latlng, truncate, toBoolean } from '~/utils'
import config from '~/config'
import client from '~/redis'
import types from '~/providerTypes'

// get list of providers to use
const providers = Object.keys(config.providers)
  .filter(provider => config.providers[provider].priority !== 0)
  .sort((x, y) => config.providers[x].priority - config.providers[y].priority)
  .map(provider => provider)

// define rate limiters based on provider's config
const limiters = {}
providers
  .filter(provider => config.providers[provider].limit)
  .forEach(provider => {
    limiters[provider] = new RateLimiter(
      config.providers[provider].limit.number,
      config.providers[provider].limit.period,
      true
    )
  }
)

// define postgres databases based on provider's config
const dbs = {}
providers
  .filter(provider => config.providers[provider].type === 'pg')
  .forEach(provider => {
    dbs[provider] = pgp({
      host: config.providers[provider].host,
      port: config.providers[provider].port,
      database: config.providers[provider].db,
      user: config.providers[provider].username,
      password: config.providers[provider].password
    })
  }
)

// default stats object if redis doesn't have a copy
const defaultStats = {
  lookups: {}
}

const api = () => {
  let api = Router()
  api.get('/status', (req, res) => {
    const uptime = moment.duration(process.uptime(), 'seconds').humanize()
    const redis = client.server_info
    const routes = []
    api.stack.forEach(singleRoute => {
      routes.push(singleRoute.route.path)
    })

    client.multi().dbsize().get('reverse_geocoder_stats').exec((error, replies) => {
      if (error) return res.status(500).json({ errors: ['problem with redis'] })
      const keys = replies[0]
      const stats = replies[1] ? JSON.parse(replies[1]) : defaultStats
      return res.json({ uptime, keys, providers, routes, stats, redis })
    })
  })

  api.post('/reverse-geocode', (req, res) => {
    // request body should include a lat and lng key
    if (!req.body.lat || !req.body.lng) {
      return res.status(400).json({ errors: ['lat and lng value required'] })
    }
    // lat and lng should be numbers
    if (!_.isNumber(req.body.lat) || !_.isNumber(req.body.lng)) {
      return res.status(400).json({ errors: ['lat and lng must be a number'] })
    }
    // clean up lat and lng values
    const input = {
      lat: truncate(req.body.lat),
      lng: truncate(req.body.lng)
    }
    client.get(latlng(input.lat, input.lng), (error, reply) => {
      // catch redis error
      if (error) return res.status(500).json({ errors: ['problem with redis'] })
      // if latlng key exists in redis, return cached result to client
      if (reply !== null && !toBoolean(req.query.skipCache)) {
        let cached
        try {
          cached = JSON.parse(reply)
        } catch (error) {
          return res.status(500).json({ errors: ['problem with cached value'] })
        }
        return res.set('redis', 'HIT').json({ 'input': input, ...cached })
      }

      const runner = (providers, errors = [], index = 0) => {
        const name = providers[index]
        const provider = config.providers[providers[index]]
        return types[provider.type](name, provider, input, dbs[name])
        .then((result) => {
          return { result, provider: name, errors }
        })
        .catch(error => {
          errors.push(error.message)
          if (index === providers.length - 1) {
            return { result: null, errors }
          }
          return runner(providers, errors, index + 1)
        })
      }

      runner(providers)
        .then(({ result, provider, errors } = {}) => {
          if (!result) {
            return res.status(500).json({ errors })
          } else {
            const date = new Date().toISOString()
            // add provider's response to the cache
            client.set(latlng(input.lat, input.lng), JSON.stringify({ output: result, date_retrieved: date, provider, errors }))
            // increment lookup count
            client.get('reverse_geocoder_stats', (error, reply) => {
              if (error) return
              let stats
              reply ? stats = JSON.parse(reply) : stats = defaultStats
              stats.lookups[provider] ? stats.lookups[provider]++ : stats.lookups[provider] = 1
              client.set('reverse_geocoder_stats', JSON.stringify(stats))
            })
            // return result to client
            return res.set('redis', 'MISS').json({ 'input': input, 'output': result, date_retrieved: date, provider, errors })
          }
        })
        .catch(error => {
          throw error
        })
    })
  })
  return api
}

export default api
