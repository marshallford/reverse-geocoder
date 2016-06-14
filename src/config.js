const config = {
  truncate: 5,
  providers: {
    google: {
      type: 'http',
      priority: 2,
      limit: {
        'number': 2500,
        'period': 'day'
      },
      key: process.env['REVERSE_GEOCODER_GOOGLE_API_KEY'],
      url: (lat, lng, key) => `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`,
      path: 'data.results[0].formatted_address'
    },
    openstreetmap: {
      type: 'http',
      limit: {
        'number': 1,
        'period': 'second'
      },
      priority: 3,
      key: 'N/A',
      url: (lat, lng, key) => `http://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=0`,
      path: 'data.display_name'
    },
    // for testing
    status400: {
      type: 'http',
      priority: 0,
      limit: {
        'number': 100,
        'period': 'minute'
      },
      key: ' ',
      url: () => 'http://httpstat.us/400',
      path: 'data'
    },
    postgis: {
      type: 'pg',
      limit: null,
      priority: 1,
      host: 'localhost',
      port: '5432',
      db: 'gisdb',
      username: process.env['REVERSE_GEOCODER_POSTGIS_USERNAME'],
      password: process.env['REVERSE_GEOCODER_POSTGIS_PASSWORD']
    }
  }
}

export default config
