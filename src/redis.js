import redis from 'redis'
import _ from 'lodash'
import bluebird from 'bluebird'
import config from '~/config'

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

export default redis.createClient(_.get(config, 'redis.options', {}))
