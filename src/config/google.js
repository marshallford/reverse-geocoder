export default (result) => {
  const extrasToCheck = [
    { name: 'street_number', path: 'street_number' },
    { name: 'route', path: 'route' },
    { name: 'neighborhood', path: 'neighborhood' },
    { name: 'locality', path: 'locality' },
    { name: 'country', path: 'country' },
    { name: 'zip_code', path: 'postal_code' },
    { name: 'township', path: 'administrative_area_level_3' },
    { name: 'county', path: 'administrative_area_level_2' },
    { name: 'state', path: 'administrative_area_level_1' },
  ]
  let extras = {}

  result.forEach(component => {
    extrasToCheck.forEach(extra => {
      if (component.types.includes(extra.path)) {
        extras[extra.name] = component.long_name
      }
    })
  })

  // TODO rewrite
  // location is simply the best way to describe the point, in this order:
  // city -> township -> county -> state
  let location = ''
  let state = (extras.state === undefined) ? '' : extras.state
  let country = (extras.country === undefined) ? '' : extras.country
  if (extras.county) location = extras.county
  if (extras.township) location = extras.township
  if (extras.locality) location = extras.locality
  if (result) {
    extras['location'] = location + ', ' + state + ', ' + country
  }

  return extras
}
