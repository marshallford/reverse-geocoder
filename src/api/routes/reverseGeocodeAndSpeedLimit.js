import { Router } from 'express'
import _ from 'lodash'
import { latlng, latlngValidator, toBoolean, resolvedProviders, ProviderError } from '~/utils'
import config from '~/config'
import logger from '~/logger'
import client from '~/redis'
import types from '~/providerTypes'

const queryParamsToBool = (req, res, next) => {
  ['skipCache', 'replaceCache', 'allProviders'].forEach(el => { req.query[el] = toBoolean(req.query[el]) })
  next()
}

const reverseGeocodeAndSpeedLimit = (scope) => {
  let r = Router()
  r.post('/', queryParamsToBool, async (req, res) => {
    const prefixedlatlng = (lat, lng) => `${scope}/${latlng(lat, lng)}`

    let input
    try {
      input = latlngValidator(req.body)
    } catch (err) {
      return res.status(400).json({ errors: [err.message] })
    }

    // check for cached value
    if ([req.query.skipCache, req.query.replaceCache, req.query.allProviders].every(el => !el)) {
      try {
        const reply = await client.getAsync(prefixedlatlng(input.lat, input.lng))
        if (reply !== null) {
          return res.set('redis', 'HIT').json({ input, ...JSON.parse(reply) })
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
    const providersInScope = resolvedProviders.filter(provider => config.providers[provider].scope === scope)

    const results = {}
    const errors = []
    let provider

    // iterate over providers in the request scope
    for (let index in providersInScope) {
      provider = providersInScope[index]
      const info = config.providers[provider]
      try {
        results[provider] = await types[info.type](provider, info, input)
        if (!req.query.allProviders) break
      } catch (err) {
        if (err instanceof ProviderError) {
          errors.push(err.message)
        } else {
          throw err
        }
      }
    }
    if (_.isEmpty(results)) {
      // no valid providers
      return res.status(400).json({ errors })
    } else {
      // add valid result to cache, updates stats
      const date = new Date().toISOString()
      // add provider's response to the cache
      if ([req.query.skipCache, req.query.allProviders].every(el => !el)) {
        const key = prefixedlatlng(input.lat, input.lng)
        const value = JSON.stringify({ ...results[provider], date_retrieved: date, provider, errors })
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
          logger.error(`${provider}: could not get/set stats key or could not parse key`)
        }
      }
      // return result to client
      if (req.query.allProviders) {
        return res.set('redis', 'MISS').json({ input, results, date_retrieved: date, errors })
      } else {
        return res.set('redis', 'MISS').json({ input, ...results[provider], date_retrieved: date, provider, errors })
      }
    }
  })
  return r
}

export default reverseGeocodeAndSpeedLimit
