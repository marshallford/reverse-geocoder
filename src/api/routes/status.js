import { Router } from 'express'
import moment from 'moment'
import { version } from '../../../package.json'
import config from '~/config'
import client from '~/redis'
import { providersByScope } from '~/utils'

const status = () => {
  let r = Router()
  r.get('/', async (req, res) => {
    const uptime = moment.duration(process.uptime(), 'seconds').humanize() // process uptime
    const redis = client.server_info // redis info at connect (not live)
    // list of routes on /api/v1
    // hardcoded as routes inside routers do not have a path value
    const routes = ['/status', '/reverse-geocode', '/speed-limit']
    // api.stack.forEach(singleRoute => {
    //   routes.push(singleRoute.route.path)
    // })
    try {
      const [keys, rawStats] = await client.multi().dbsize().get(config.stats.redisKey).execAsync()
      const stats = rawStats ? JSON.parse(rawStats) : {} // stats object containing lookup counts
      return res.json({ uptime, keys, providers: providersByScope, routes, stats, version, redis })
    } catch (err) {
      if (err instanceof SyntaxError) {
        return res.status(500).json({ errors: ['problem parsing cached value'] })
      } else {
        return res.status(500).json({ errors: ['problem with redis/cached value'] })
      }
    }
  })
  return r
}

export default status
