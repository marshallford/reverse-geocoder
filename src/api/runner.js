import types from '~/providerTypes'
import config from '~/config'

const runner = (providers, input, errors = [], index = 0) => {
  const name = providers[index]
  const provider = config.providers[providers[index]]
  return types[provider.type](name, provider, input)
  .then((result) => {
    return { result, provider: name, errors }
  })
  .catch(error => {
    errors.push(error.message)
    if (index === providers.length - 1) {
      return { result: null, errors }
    }
    return runner(providers, input, errors, index + 1)
  })
}

export default runner
