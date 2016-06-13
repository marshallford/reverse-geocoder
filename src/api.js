import { Router } from 'express'
import client from '~/redis'
import axios from 'axios' // HTTP client tool
import { latlng, truncate } from '~/utils'
import config from '~/config'
import _ from 'lodash'
import { RateLimiter } from 'limiter'

const limiter = new RateLimiter(
  config.providers.openstreetmap.limit.number,
  config.providers.google.limit.period,
  true
)

const api = () => {
  var api = Router()
  api.post('/reverse-geocode', (req, res) => {
    if (!req.body.lat || !req.body.lng) {
      res.status(400).json({ message: 'lat and lng value required' })
      return // not sure why this is required
    }
    const input = {
      lat: truncate(req.body.lat),
      lng: truncate(req.body.lng)
    }
    client.get(latlng(input.lat, input.lng), (error, reply) => {
      if (error) {
        res.status(500).json({ message: 'problem with redis' })
      }
      if (reply === null) {
        limiter.removeTokens(1, (error, remainingRequests) => {
          if (error || remainingRequests < 0) {
            res.status(500).json({ message: 'provider rate limit reached' })
          } else {
            axios.get(config.providers.openstreetmap.url(input.lat, input.lng, config.providers.openstreetmap.key))
              .then((response) => {
                const result = _.get(response, config.providers.openstreetmap.path)
                if (!result) {
                  res.status(500).json({ message: 'not a valid provider path' })
                } else {
                  client.set(latlng(input.lat, input.lng), result)
                  res.set('redis', 'MISS')
                  res.json({ 'input': input, 'output': result })
                }
              })
              .catch((response) => {
                console.log(response)
                res.status(500).json({ message: 'could not connect to provider' })
              })
          }
        })
      } else {
        res.set('redis', 'HIT')
        res.json({ 'input': input, 'output': reply })
      }
    })
  })
  return api
}

export default api
