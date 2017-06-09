import 'babel-polyfill' // https://babeljs.io/docs/usage/polyfill/
import winston from 'winston'
import cluster from 'cluster'
import os from 'os'
import client from '~/redis'
import app from '~/app'
import config from '~/config'

if (cluster.isMaster) {
  if (process.env.NODE_ENV === 'development') {
    cluster.fork()
  } else {
    os.cpus().forEach((cpu) => {
      cluster.fork()
    })
  }

  cluster.on('online', (worker) => {
    winston.info(`worker ${worker.process.pid} is up`)
  })

  cluster.on('exit', (worker) => {
    winston.error(`worker ${worker.process.pid} is down`)
    cluster.fork()
  })
} else {
  // connect to redis, then start HTTP server
  client.on('connect', () => {
    app.server.listen(config.port, () => {
      winston.info(`starting server: http://localhost:${app.server.address().port} (${cluster.worker.process.pid})`)
    })
  })
  // catch redis connection errors
  client.on('error', (err) => {
    winston.error('redis client error', err.message, err.stack)
  })
}
