/* global describe it before */
/* eslint-disable no-unused-expressions */
import 'babel-polyfill'
import chai from 'chai'
import chaiHttp from 'chai-http'
import app from '~/app'
import client from '~/redis'
import { removeLogging } from '~/logger'

removeLogging()
chai.use(chaiHttp)
const expect = chai.expect

const badInputs = [
  null,
  0,
  '',
  'foo',
  {},
  { lat: '50' },
  { lng: '50' },
  { lat: 50 },
  { lng: 50 },
  { lat: '50', lng: '50' },
]

describe('status endpoint', () => {
  before(async () => {
    await client.flushdbAsync()
  })
  it('responds correctly', async () => {
    const res = await chai.request(app).get('/api/v1/status')
    expect(res).to.have.status(200)
    expect(res).to.be.json
    expect(res.body.keys).to.equal(0)
  })
})

const reverseGeocodeEndpoint = '/api/v1/reverse-geocode'
describe('reverse-geocode endpoint', () => {
  before(async () => {
    await client.flushdbAsync()
  })

  const input = { lat: 50, lng: 50 }
  it('cache miss', async () => {
    const res = await chai.request(app).post(reverseGeocodeEndpoint).send(input)
    expect(res).to.have.status(200)
    expect(res).to.have.header('redis', 'MISS')
    expect(res).to.be.json
    expect(res.body).to.have.all.keys('input', 'output', 'extras', 'date_retrieved', 'provider', 'errors')
    expect(res.body.input).to.deep.equal(input)
  })

  it('cache hit', async () => {
    const res = await chai.request(app).post(reverseGeocodeEndpoint).send(input)
    expect(res).to.have.status(200)
    expect(res).to.have.header('redis', 'HIT')
    expect(res).to.be.json
    expect(res.body).to.have.all.keys('input', 'output', 'extras', 'date_retrieved', 'provider', 'errors')
    expect(res.body.input).to.deep.equal(input)
  })

  it('allProviders query', async () => {
    const res = await chai.request(app).post(`${reverseGeocodeEndpoint}?allProviders=true`).send(input)
    expect(res).to.have.status(200)
    expect(res).to.have.header('redis', 'MISS')
    expect(res).to.be.json
    expect(res.body).to.have.all.keys('input', 'results', 'date_retrieved', 'errors')
    expect(res.body.input).to.deep.equal(input)
    expect(res.body.results).to.be.a('object')
  })

  it('bad request', async () => {
    for (let index in badInputs) {
      const input = badInputs[index]
      // https://github.com/chaijs/chai-http/issues/75#issuecomment-300898371
      try {
        await chai.request(app).post('/api/v1/reverse-geocode').send(input)
        expect(true).to.be.false // Fail the test
      } catch (err) {
        expect(err.response).to.have.status(400)
        expect(err.response).to.be.json
        expect(err.response.body).to.all.keys('errors')
      }
    }
  })
})

describe('speed-limit endpoint', () => {
  before(async () => {
    await client.flushdbAsync()
  })
  const input = { lat: 46.86675, lng: -96.79474 }
  it('cache miss', async () => {
    const res = await chai.request(app).post('/api/v1/speed-limit').send(input)
    expect(res).to.have.status(200)
    expect(res).to.have.header('redis', 'MISS')
    expect(res).to.be.json
    expect(res.body).to.have.all.keys('input', 'output', 'extras', 'date_retrieved', 'provider', 'errors')
    expect(res.body.input).to.deep.equal(input)
  })

  it('cache hit', async () => {
    const res = await chai.request(app).post('/api/v1/speed-limit').send(input)
    expect(res).to.have.status(200)
    expect(res).to.have.header('redis', 'HIT')
    expect(res).to.be.json
    expect(res.body).to.have.all.keys('input', 'output', 'extras', 'date_retrieved', 'provider', 'errors')
    expect(res.body.input).to.deep.equal(input)
  })

  it('allProviders query', async () => {
    const res = await chai.request(app).post(`${reverseGeocodeEndpoint}?allProviders=true`).send(input)
    expect(res).to.have.status(200)
    expect(res).to.have.header('redis', 'MISS')
    expect(res).to.be.json
    expect(res.body).to.have.all.keys('input', 'results', 'date_retrieved', 'errors')
    expect(res.body.input).to.deep.equal(input)
    expect(res.body.results).to.be.a('object')
  })

  it('bad request', async () => {
    for (let index in badInputs) {
      const input = badInputs[index]
      // https://github.com/chaijs/chai-http/issues/75#issuecomment-300898371
      try {
        await chai.request(app).post('/api/v1/reverse-geocode').send(input)
        expect(true).to.be.false // Fail the test
      } catch (err) {
        expect(err.response).to.have.status(400)
        expect(err.response).to.be.json
        expect(err.response.body).to.all.keys('errors')
      }
    }
  })
})
