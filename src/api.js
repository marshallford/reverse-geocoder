import { Router } from 'express'
import client from '~/redis'
import axios from 'axios' // HTTP client tool
import { latlng } from '~/utils'
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
    }
    client.get(latlng(req.body.lat, req.body.lng), (error, reply) => {
      if (error) {
        res.status(500).json({ message: 'problem with redis' })
      }
      if (reply === null) {
        res.set('redis', 'MISS')
        limiter.removeTokens(1, (error, remainingRequests) => {
          if (error || remainingRequests < 0) {
            res.status(500).json({ message: 'provider rate limit reached' })
          } else {
            axios.get(config.providers.openstreetmap.url(req.body.lat, req.body.lng, config.providers.openstreetmap.key))
              .then((response) => {
                const path = _.get(response, config.providers.openstreetmap.path)
                if (!path) {
                  res.status(500).json({ message: 'not a valid provider path' })
                } else {
                  client.set(latlng(req.body.lat, req.body.lng), path)
                  res.json({ 'message': path })
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
        res.json({ 'message': reply })
      }
    })
  })
  return api
}

export default api
