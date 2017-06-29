import { Router } from 'express'
// import { RateLimiter } from 'limiter'
import { reverseGeocodeAndSpeedLimitRoute, statusRoute } from '~/api/routes'

// TODO not in use atm
// define rate limiters based on provider's config
// const limiters = {}
// providers
//   .filter(provider => config.providers[provider].limit)
//   .forEach(provider => {
//     limiters[provider] = new RateLimiter(
//       config.providers[provider].limit.number,
//       config.providers[provider].limit.period,
//       true
//     )
//   }
// )

const api = () => {
  let api = Router()
  api.use('/reverse-geocode', reverseGeocodeAndSpeedLimitRoute('reverse_geocode'))
  api.use('/speed-limit', reverseGeocodeAndSpeedLimitRoute('speed_limit'))
  api.use('/status', statusRoute())
  return api
}

export default api
