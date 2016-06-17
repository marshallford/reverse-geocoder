/*global describe it*/
import 'babel-polyfill'
import { expect } from 'chai'
import { toBoolean } from '~/utils'

describe('convert string to boolean', () => {
  it('returns true when expected', () => {
    expect(toBoolean('true')).to.equal(true)
    expect(toBoolean(' true ')).to.equal(true)
    expect(toBoolean('TRUE')).to.equal(true)
    expect(toBoolean('TruE')).to.equal(true)

    expect(toBoolean('yes')).to.equal(true)
    expect(toBoolean(' yes ')).to.equal(true)
    expect(toBoolean('YES')).to.equal(true)
    expect(toBoolean('YeS')).to.equal(true)

    expect(toBoolean('on')).to.equal(true)
    expect(toBoolean(' on ')).to.equal(true)
    expect(toBoolean('ON')).to.equal(true)
    expect(toBoolean('oN')).to.equal(true)

    expect(toBoolean(true)).to.equal(true)
  })
  it('returns false when expected', () => {
    expect(toBoolean('foo')).to.equal(false)
    expect(toBoolean('false')).to.equal(false)
    expect(toBoolean('no')).to.equal(false)
    expect(toBoolean('off')).to.equal(false)

    expect(toBoolean(false)).to.equal(false)
    expect(toBoolean(null)).to.equal(false)
    expect(toBoolean(undefined)).to.equal(false)
  })
})
