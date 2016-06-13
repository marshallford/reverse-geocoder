const config = {
  providers: {
    google: {
      key: process.env['REVERSE_GEOCODE_GOOGLE_API_KEY'],
      url: (lat, lng, key) => `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`,
      path: 'data.results[0].formatted_address',
      limit: {
        'number': 2500,
        'period': 'day'
      }
    },
    openstreetmap: {
      key: ' ',
      url: (lat, lng, key) => `http://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=0`,
      path: 'data.display_name',
      limit: {
        'number': 1,
        'period': 'second'
      }
    },
    status400: {
      key: ' ',
      url: () => 'http://httpstat.us/400',
      path: 'data',
      limit: {
        'number': 100,
        'period': 'minute'
      }
    }
  }
}

export default config
