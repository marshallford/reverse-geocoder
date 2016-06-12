import http from 'http' // HTTP Server
import express from 'express' // HTTP improvements?
import bodyParser from 'body-parser' // Parse JSON
import client from '~/redis'
import api from '~/api'
import config from '~/config'

const app = express()
app.server = http.createServer(app)
app.use(bodyParser.json())
app.use('/api/v1', api())

const requiredProviderInfo = ['key', 'url', 'path']

// validate config
Object.keys(config.providers).forEach(provider => {
  requiredProviderInfo.forEach(info => {
    if (!config.providers[provider][info]) {
      throw new Error(`Provider ${provider} is missing ${info} information`)
    }
  })
})

// connect to redis, then start HTTP server
client.on('connect', () => {
  app.server.listen(process.env.PORT || 8080)
  console.log(`Starting server: http://localhost:${app.server.address().port}`)
})

client.on('error', (error) => {
  console.log(error)
})
