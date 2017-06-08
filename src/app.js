import http from 'http' // HTTP Server
import express from 'express' // HTTP improvements
import bodyParser from 'body-parser' // Parse JSON
import cors from 'cors' // Cross-origin resource sharing
import winston from 'winston' // Async logger

import api from '~/api'
import config from '~/config'
import { toBoolean } from '~/utils'

// define web server
const app = express()
app.server = http.createServer(app)
app.disable('x-powered-by') // https://github.com/helmetjs/hide-powered-by
app.use(bodyParser.json())
// bodyParser error handling
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.statusCode === 400) {
    winston.error(err.stack)
    res.status(400).json({ errors: ['invalid json'] })
  } else {
    next(err)
  }
})
if (toBoolean(config.cors)) {
  app.use(cors()) // https://github.com/expressjs/cors#simple-usage-enable-all-cors-requests
  app.options('*', cors()) // https://github.com/expressjs/cors#enabling-cors-pre-flight
}

// logging middleware
if (config.log > 0) {
  app.use((req, res, next) => {
    winston.info(`${new Date().toISOString()} ${req.method} ${req.path}`)
    next()
  })
}

// define routes here, before catch-all functions, after cors setup and logging middlware
app.use('/api/v1', api())

// 404
app.use((req, res) => {
  res.status(404).json({ errors: [`cannot ${req.method} ${req.path}`] })
})

// 500
app.use((err, req, res, next) => {
  winston.error(err.stack)
  res.status(500).json({ errors: ['catch-all server error, check the logs'] })
})

// validate config
const requiredProviderInfo = ['type', 'priority', 'limit', 'path']
const requiredHttpProviderInfo = ['key', 'url', 'timeout']
const requiredPgProviderInfo = ['host', 'port', 'database', 'user', 'password', 'sql']

Object.keys(config.providers).forEach(provider => {
  requiredProviderInfo.forEach(info => {
    if (config.providers[provider][info] === undefined) {
      throw new Error(`Provider ${provider} is missing ${info} information`)
    }
  })
  requiredHttpProviderInfo.forEach(info => {
    if (config.providers[provider][info] === undefined && config.providers[provider].type === 'http') {
      throw new Error(`Provider ${provider} is missing ${info} information`)
    }
  })
  requiredPgProviderInfo.forEach(info => {
    if (config.providers[provider][info] === undefined && config.providers[provider].type === 'pg') {
      throw new Error(`Provider ${provider} is missing ${info} information`)
    }
  })
})

export default app
