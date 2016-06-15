import { Router } from 'express'
import { RateLimiter } from 'limiter'
import _ from 'lodash'
import pgpModule from 'pg-promise'
const pgp = pgpModule()
import { latlng, truncate } from '~/utils'
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

const api = () => {
  var api = Router()
  api.post('/reverse-geocode', (req, res) => {
    // request body should include a lat and lng key
    if (!req.body.lat || !req.body.lng) {
      return res.status(400).json({ message: 'lat and lng value required' })
    }
    // lat and lng should be numbers
    if (!_.isNumber(req.body.lat) || !_.isNumber(req.body.lng)) {
      return res.status(400).json({ message: 'lat and lng must be a number' })
    }
    // clean up lat and lng values
    const input = {
      lat: truncate(req.body.lat),
      lng: truncate(req.body.lng)
    }
    client.get(latlng(input.lat, input.lng), (error, reply) => {
      // catch redis error
      if (error) return res.status(500).json({ message: 'problem with redis' })
      // if latlng key exists in redis, return cached result to client
      if (reply !== null) return res.set('redis', 'HIT').json({ 'input': input, 'output': reply })

      let result = null
      const errorMessages = []

      for (let i = 0; i < providers.length; i++) {
        if (!result) {
          const name = providers[i]
          const provider = config.providers[providers[i]]
          if (provider.type === 'http') {
            types['http'](name, provider, input, (response) => {
              if (response.result) {
                result = response.result
              } else {
                errorMessages.push(response.error)
              }
            })
          }
        }
      }
      if (result) {
        // add provider's response to the cache
        client.set(latlng(input.lat, input.lng), result)
        // return result to client
        return res.set('redis', 'MISS').json({ 'input': input, 'output': result })
      } else {
        return res.status(500).json({ messages: errorMessages })
      }
    })
  })
  return api
}

export default api
