import winston from 'winston'
import config from '~/config'

const logger = new (winston.Logger)({
  level: config.log,
  transports: [
    new (winston.transports.Console)(),
  ],
})

// remove console logging if testing
const removeLogging = () => {
  if (process.env.NODE_ENV === 'test') {
    // hacky way to prevent removal errors during mocha --watch
    try {
      logger.remove(winston.transports.Console)
    } catch (err) {}
  }
}

export default logger

export {
  removeLogging,
}
