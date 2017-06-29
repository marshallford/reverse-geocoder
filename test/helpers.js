import winston from 'winston'

// remove console logging if testing
const removeLogging = () => {
  if (process.env.NODE_ENV === 'test') {
    // hacky way to prevent removal errors during mocha --watch
    try {
      winston.remove(winston.transports.Console)
    } catch (err) {}
  }
}

export {
  removeLogging,
}
