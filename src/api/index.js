import { Router } from 'express'
import { RateLimiter } from 'limiter'
import moment from 'moment'
import { version } from '../../package.json'
import config from '~/config'
import client from '~/redis'
import { providers } from '~/utils'
import { reverseGeocodeAndSpeedLimitRoute } from '~/api/routes'

// TODO not in use atm
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

const api = () => {
  let api = Router()
  api.use('/reverse-geocode', reverseGeocodeAndSpeedLimitRoute('reverse_geocode'))
  api.use('/speed-limit', reverseGeocodeAndSpeedLimitRoute('speed_limit'))

  api.get('/status', (req, res) => {
    const uptime = moment.duration(process.uptime(), 'seconds').humanize() // process uptime
    const redis = client.server_info // redis info at connect (not live)
    // list of routes on /api/v1
    // hardcoded as routes inside routers do not have a path value
    const routes = ['/status', '/reverse-geocode', '/speed-limit']
    // api.stack.forEach(singleRoute => {
    //   routes.push(singleRoute.route.path)
    // })

    client.multi().dbsize().get(config.stats.redisKey).exec((error, [keys, rawStats]) => {
      if (error) return res.status(500).json({ errors: ['problem with redis'] })
      const stats = rawStats ? JSON.parse(rawStats) : {} // stats object containing lookup counts
      return res.json({ uptime, keys, providers, routes, stats, version, redis })
    })
  })

  return api
}

export default api
