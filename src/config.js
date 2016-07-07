const config = {
  truncate: 5,
  log: process.env['REVERSE_GEOCODER_LOG'] || 'false',
  redis: {
    host: '127.0.0.1',
    port: '6379'
  },
  providers: {
    google: {
      type: 'http',
      priority: 2,
      limit: {
        'number': 2500,
        'period': 'day'
      },
      path: 'data.results[0].formatted_address',
      key: process.env['REVERSE_GEOCODER_GOOGLE_API_KEY'],
      url: (lat, lng, key) => `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
    },
    openstreetmap: {
      type: 'http',
      limit: {
        'number': 1,
        'period': 'second'
      },
      priority: 3,
      path: 'data.display_name',
      key: 'N/A',
      url: (lat, lng, key) => `http://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=0`
    },
    // for testing
    status400: {
      type: 'http',
      priority: 0,
      limit: {
        'number': 100,
        'period': 'minute'
      },
      path: 'data',
      key: ' ',
      url: () => 'http://httpstat.us/400'
    },
    postgis: {
      type: 'pg',
      limit: null,
      priority: 1,
      path: 'address',
      failures: [
        'street_number'
      ],
      host: 'localhost',
      port: '5432',
      db: 'gisdb',
      username: process.env['REVERSE_GEOCODER_POSTGIS_USERNAME'],
      password: process.env['REVERSE_GEOCODER_POSTGIS_PASSWORD'],
      query:
        `
          SELECT pprint_addy(r.addy[1]) AS address,
                 array_to_string(r.street, ',') AS cross_streets,
                 (addy[1]).address AS street_number
          FROM reverse_geocode(ST_GeomFromText('POINT($2 $1)',4326),TRUE) AS r;
        ` // note that spatial coordinates are longitude, latitude
    }
  }
}

export default config
