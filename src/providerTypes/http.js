import _ from 'lodash'
import axios from 'axios'

const httpProvider = (name, provider, input, fn) => {
  axios.get(provider.url(input.lat, input.lng, provider.key))
    .then((response) => {
      // on a "good" response set result based on provider's defined path
      const result = _.get(response, provider.path)
      // if the result is empty assume either the provider path isn't valid or the provider responded "nicely" with bad data
      if (!result) {
        fn({ error: `${name}: not a valid provider path or lat/lng` })
      } else {
        fn({ result })
      }
    })
    .catch((response) => {
      // on "bad" response, tell the client
      fn({ error: `${name}: could not connect to provider` })
    })
}

export default httpProvider
