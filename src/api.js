import { Router } from 'express'
import { RateLimiter } from 'limiter'
import _ from 'lodash'
// import axios from 'axios'
import pgpModule from 'pg-promise'
const pgp = pgpModule()
import { latlng, truncate } from '~/utils'
import config from '~/config'
import client from '~/redis'

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

      // limiters['google'].removeTokens(1, (error, remainingRequests) => {
      //   // check if provider's defined rate limit has been reached
      //   if (error || remainingRequests < 0) {
      //     return res.status(500).json({ message: 'provider rate limit reached' })
      //   }
      //   // send HTTP(s) request to provider
      //   axios.get(config.providers.google.url(input.lat, input.lng, config.providers.google.key))
      //     .then((response) => {
      //       // on "good" response set result based on provider's defined path
      //       const result = _.get(response, config.providers.google.path)
      //       // if the result is empty assume either the provider path isn't valid or the provider responded "nicely" with bad data
      //       if (!result) {
      //         return res.status(500).json({ message: 'not a valid provider path or lat/lng' })
      //       }
      //       // add provider's response to the cache
      //       client.set(latlng(input.lat, input.lng), result)
      //       // return result to client
      //       return res.set('redis', 'MISS').json({ 'input': input, 'output': result })
      //     })
      //     .catch((response) => {
      //       // on "bad" response, tell the client
      //       return res.status(500).json({ message: 'could not connect to provider' })
      //     })
      // })

      dbs['postgis'].one(config.providers['postgis'].query, [input.lat, input.lng])
        .then((response) => {
          // on "good" response set result based on provider's defined path
          const result = _.get(response, config.providers.postgis.path)
          // if the result is empty assume either the provider path isn't valid or the provider responded "nicely" with bad data
          if (!result) {
            return res.status(500).json({ message: 'not a valid provider path or lat/lng' })
          }
          // add provider's response to the cache
          client.set(latlng(input.lat, input.lng), result)
          // return result to client
          return res.set('redis', 'MISS').json({ 'input': input, 'output': result })
        })
        .catch((response) => {
          // on "bad" response, tell the client
          return res.status(500).json({ message: 'could not connect to provider' })
        })
    })
  })
  return api
}

export default api
