import { Router } from 'express'
import _ from 'lodash'
import { latlng, latlngValidator, toBoolean, providers } from '~/utils'
import config from '~/config'
import client from '~/redis'
import runner from '~/api/runner'

const reverseGeocodeAndSpeedLimitRoute = (scope) => {
  let r = Router()
  r.post('/', (req, res) => {
    const prefixedlatlng = (lat, lng) => `${scope}/${latlng(lat, lng)}`

    let input
    try {
      input = latlngValidator(req.body)
    } catch (err) {
      return res.status(400).json({ errors: [err.message] })
    }
    client.get(prefixedlatlng(input.lat, input.lng), (error, reply) => {
      // catch redis error
      if (error) return res.status(500).json({ errors: ['problem with redis'] })
      // if latlng key exists in redis, return cached result to client
      if (reply !== null && !toBoolean(req.query.skipCache)) {
        try {
          return res.set('redis', 'HIT').json({ input, ...JSON.parse(reply) })
        } catch (error) {
          return res.status(500).json({ errors: ['problem with cached value'] })
        }
      }

      runner(providers.filter(provider => config.providers[provider].scope === scope), input)
        .then(({ result, provider, errors } = {}) => {
          if (!result) {
            return res.status(500).json({ errors })
          } else {
            const date = new Date().toISOString()
            // add provider's response to the cache
            const key = prefixedlatlng(input.lat, input.lng)
            const value = JSON.stringify({ ...result, date_retrieved: date, provider, errors })
            _.has(config, 'redis.ttl') ? client.set(key, value, 'EX', config.redis.ttl) : client.set(key, value)
            // increment lookup count
            client.get(config.stats.redisKey, (error, reply) => {
              if (!error) {
                let stats = {}
                if (reply) stats = JSON.parse(reply)
                if (_.has(stats, `lookups.${scope}.${provider}`)) {
                  stats.lookups[scope][provider]++
                } else {
                  _.set(stats, `lookups.${scope}.${provider}`, 0)
                }
                client.set(config.stats.redisKey, JSON.stringify(stats))
              }
            })
            // return result to client
            return res.set('redis', 'MISS').json({ input, ...result, date_retrieved: date, provider, errors })
          }
        })
        .catch(error => {
          throw error
        })
    })
  })
  return r
}

export default reverseGeocodeAndSpeedLimitRoute
