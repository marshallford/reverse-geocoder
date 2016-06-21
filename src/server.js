import 'babel-polyfill'
import http from 'http' // HTTP Server
import express from 'express' // HTTP improvements?
import bodyParser from 'body-parser' // Parse JSON
import cors from 'cors'
import client from '~/redis'
import api from '~/api'
import config from '~/config'

// define web server
const app = express()
app.server = http.createServer(app)
app.disable('x-powered-by')
app.use(bodyParser.json())
app.use(cors())
app.use('/api/v1', api())
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ errors: ['catch-all server error, check the logs'] })
})

// validate config
const requiredProviderInfo = ['type', 'priority', 'limit', 'path']
const requiredHttpProviderInfo = ['key', 'url']
const requiredPgProviderInfo = ['host', 'port', 'db', 'username', 'password', 'query']

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

// connect to redis, then start HTTP server
client.on('connect', () => {
  app.server.listen(process.env.PORT || 8080)
  console.log(`Starting server: http://localhost:${app.server.address().port}`)
})

// catch redis connection errors
client.on('error', (error) => {
  console.error(error)
})
