import sample from './config.sample'
import test from './config.test'

const config = process.env['NODE_ENV'] === 'test' ? test : sample

export default config
