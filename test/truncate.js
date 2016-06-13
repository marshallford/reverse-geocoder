/*global describe it*/
import { expect } from 'chai'
import { truncate } from '~/utils'

describe('truncate number strings', () => {
  it('makes no changes correctly', () => {
    const positiveDecimal = '45.222'
    const negativeDecimal = '-55.888'
    const positiveInteger = '12'
    const negativeInteger = '-24'

    expect(truncate(positiveDecimal, 3)).to.equal(positiveDecimal)
    expect(truncate(negativeDecimal, 3)).to.equal(negativeDecimal)
    expect(truncate(positiveInteger, 3)).to.equal(positiveInteger)
    expect(truncate(negativeInteger, 3)).to.equal(negativeInteger)
  })
  it('truncates correctly', () => {
    const positiveDecimal = '45.12345'
    const negativeDecimal = '-55.56789'

    expect(truncate(positiveDecimal, 3)).to.equal('45.123')
    expect(truncate(negativeDecimal, 3)).to.equal('-55.567')
  })
  it('adds zeroes correctly', () => {
    expect(truncate('45.0', 4)).to.equal('45.0000')
    expect(truncate('45.00', 4)).to.equal('45.0000')
    expect(truncate('45.3433', 4)).to.equal('45.3433')
    expect(truncate('45.343', 4)).to.equal('45.3430')
  })
})
