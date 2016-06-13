import { Router } from 'express'
import { RateLimiter } from 'limiter'
import _ from 'lodash'
import axios from 'axios'
import { latlng, truncate } from '~/utils'
import config from '~/config'
import client from '~/redis'

const limiter = new RateLimiter(
  config.providers.openstreetmap.limit.number,
  config.providers.google.limit.period,
  true
)

const api = () => {
  var api = Router()
  api.post('/reverse-geocode', (req, res) => {
    if (!req.body.lat || !req.body.lng) {
      return res.status(400).json({ message: 'lat and lng value required' })
    }
    const input = {
      lat: truncate(req.body.lat),
      lng: truncate(req.body.lng)
    }
    client.get(latlng(input.lat, input.lng), (error, reply) => {
      if (error) return res.status(500).json({ message: 'problem with redis' })
      if (reply !== null) return res.set('redis', 'HIT').json({ 'input': input, 'output': reply })

      limiter.removeTokens(1, (error, remainingRequests) => {
        if (error || remainingRequests < 0) {
          return res.status(500).json({ message: 'provider rate limit reached' })
        }
        axios.get(config.providers.openstreetmap.url(input.lat, input.lng, config.providers.openstreetmap.key))
          .then((response) => {
            const result = _.get(response, config.providers.openstreetmap.path)
            if (!result) {
              return res.status(500).json({ message: 'not a valid provider path or lat/lng' })
            }
            client.set(latlng(input.lat, input.lng), result)
            return res.set('redis', 'MISS').json({ 'input': input, 'output': result })
          })
          .catch((response) => {
            return res.status(500).json({ message: 'could not connect to provider' })
          })
      })
    })
  })
  return api
}

export default api
