import { Router } from 'express'
import { RateLimiter } from 'limiter'
import _ from 'lodash'
import axios from 'axios'
import { latlng, truncate } from '~/utils'
import config from '~/config'
import client from '~/redis'

// define rate limiter based on provider's config
const limiter = new RateLimiter(
  config.providers.google.limit.number,
  config.providers.google.limit.period,
  true
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

      limiter.removeTokens(1, (error, remainingRequests) => {
        // check if provider's defined rate limit has been reached
        if (error || remainingRequests < 0) {
          return res.status(500).json({ message: 'provider rate limit reached' })
        }
        // send HTTP(s) request to provider
        axios.get(config.providers.google.url(input.lat, input.lng, config.providers.google.key))
          .then((response) => {
            // on "good" response set result based on provider's defined path
            const result = _.get(response, config.providers.google.path)
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
  })
  return api
}

export default api
