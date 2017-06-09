import { Router } from 'express'
import winston from 'winston'
import _ from 'lodash'
import { latlng, latlngValidator, toBoolean, providers, ProviderError } from '~/utils'
import config from '~/config'
import client from '~/redis'
import types from '~/providerTypes'

const reverseGeocodeAndSpeedLimitRoute = (scope) => {
  let r = Router()
  r.post('/', async (req, res) => {
    const prefixedlatlng = (lat, lng) => `${scope}/${latlng(lat, lng)}`

    let input
    try {
      input = latlngValidator(req.body)
    } catch (err) {
      return res.status(400).json({ errors: [err.message] })
    }

    // check for cached value
    if (!toBoolean(req.query.skipCache)) {
      try {
        const reply = await client.getAsync(prefixedlatlng(input.lat, input.lng))
        if (reply !== null) {
          return await res.setAsync('redis', 'HIT').json({ input, ...JSON.parse(reply) })
        }
      } catch (err) {
        if (err instanceof SyntaxError) {
          return res.status(500).json({ errors: ['problem parsing cached value'] })
        } else {
          return res.status(500).json({ errors: ['problem with redis/cached value'] })
        }
      }
    }

    // Missed cache
    let result, provider
    const errors = []
    const providersInScope = providers.filter(provider => config.providers[provider].scope === scope)

    // iterate over providers in the request scope
    for (let index in providersInScope) {
      provider = providersInScope[index]
      const info = config.providers[provider]
      try {
        result = await types[info.type](provider, info, input)
        break
      } catch (err) {
        if (err instanceof ProviderError) {
          errors.push(err.message)
        } else {
          throw err
        }
      }
    }
    if (!result) {
      // no valid providers
      return res.status(500).json({ errors })
    } else {
      // add valid result to cache, updates stats
      const date = new Date().toISOString()
      // add provider's response to the cache
      const key = prefixedlatlng(input.lat, input.lng)
      const value = JSON.stringify({ ...result, date_retrieved: date, provider, errors })
      try {
        _.has(config, 'redis.ttl') ? client.setAsync(key, value, 'EX', config.redis.ttl) : client.setAsync(key, value)
      } catch (err) {
        return res.status(500).json({ errors: ['problem with redis'] })
      }
      try {
        let stats = {}
        const reply = await client.getAsync(config.stats.redisKey)
        if (reply) stats = JSON.parse(reply)
        if (_.has(stats, `lookups.${scope}.${provider}`)) {
          stats.lookups[scope][provider]++
        } else {
          _.set(stats, `lookups.${scope}.${provider}`, 0)
        }
        await client.setAsync(config.stats.redisKey, JSON.stringify(stats))
      } catch (err) {
        winston.error(`${provider}: could not get/set stats key or could not parse key`)
      }

      // return result to client
      return res.set('redis', 'MISS').json({ input, ...result, date_retrieved: date, provider, errors })
    }
  })
  return r
}

export default reverseGeocodeAndSpeedLimitRoute
