import redis from 'redis'
import _ from 'lodash'
import config from '~/config'

export default redis.createClient(_.get(config, 'redis.options', {}))
