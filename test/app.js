/* global describe it */
import 'babel-polyfill'
import chai from 'chai'
import chaiHttp from 'chai-http'
import app from '~/app'

chai.use(chaiHttp)
const expect = chai.expect

describe('status endpoint', () => {
  it('responds', (done) => {
    chai.request(app).get('/api/v1/status')
      .end((err, res) => {
        expect(err).to.be.undefined()
        expect(res).to.have.status(200)
      })
    done()
  })
})
