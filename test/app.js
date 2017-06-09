/* global describe it before */
/* eslint-disable no-unused-expressions */
import 'babel-polyfill'
import chai from 'chai'
import chaiHttp from 'chai-http'
import app from '~/app'
import client from '~/redis'

chai.use(chaiHttp)
const expect = chai.expect

describe('status endpoint', async () => {
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

describe('reverse-geocode endpoint', async () => {
  before(async () => {
    await client.flushdbAsync()
  })
  it('responds correctly', async () => {
    const input = { lat: 50, lng: 50 }
    const res = await chai.request(app).post('/api/v1/reverse-geocode').send(input)
    expect(res).to.have.status(200)
    expect(res).to.have.header('redis', 'MISS')
    expect(res).to.be.json
    expect(res.body).to.have.any.keys('input', 'output', 'extras', 'date_retrieved', 'provider', 'errors')
    console.log(typeof res.body.input)
    expect(res.body.input).to.deep.equal(input)
  })
})
