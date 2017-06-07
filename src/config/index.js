import customGoogle from './google'

const config = {
  truncate: 5,
  log: parseInt(process.env['REVERSE_GEOCODER_LOG']) || 0,
  redis: {
    options: {
      host: '127.0.0.1',
      port: '6379',
    },
    ttl: 60 * 24 * 30 * 1, // 1 month expiration
  },
  port: parseInt(process.env['REVERSE_GEOCODER_PORT']) || 8080,
  cors: process.env['REVERSE_GEOCODER_CORS'] || 'true',
  stats: {
    redisKey: 'stats',
  },
  providers: {
    googleroads: {
      type: 'http',
      scope: 'speed_limit',
      priority: 1,
      limit: {
        number: 10000,
        period: 'day',
      },
      path: 'data.speedLimits[0]',
      key: process.env['REVERSE_GEOCODER_GOOGLE_API_KEY'],
      url: (lat, lng, key) => `https://roads.googleapis.com/v1/speedLimits?units=MPH&path=${lat},${lng}&key=${key}`,
      timeout: 500,
    },
    google: {
      type: 'http',
      scope: 'reverse_geocode',
      priority: 2,
      limit: {
        'number': 180000,
        'period': 'hour',
      },
      path: 'data.results[0].formatted_address',
      key: process.env['REVERSE_GEOCODER_GOOGLE_API_KEY'],
      url: (lat, lng, key) => `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`,
      timeout: 500,
      extrasPath: 'data.results[0].address_components',
      extras: (result) => customGoogle(result),
    },
    openstreetmap: {
      type: 'http',
      scope: 'reverse_geocode',
      limit: {
        'number': 1,
        'period': 'second',
      },
      priority: 3,
      path: 'data.display_name',
      key: 'N/A',
      url: (lat, lng, key) => `http://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=0`,
      timeout: 500,
    },
    // for testing
    status400: {
      type: 'http',
      scope: 'reverse_geocode',
      priority: 0,
      limit: {
        'number': 100,
        'period': 'minute',
      },
      path: 'data',
      key: ' ',
      url: () => 'http://httpstat.us/400',
      timeout: 250,
    },
    postgis: {
      type: 'pg',
      scope: 'reverse_geocode',
      limit: null,
      priority: 1,
      path: 'address',
      failures: [
        // 'street_number',
        'city',
      ],
      host: 'localhost',
      port: '5432',
      database: 'gisdb',
      user: process.env['REVERSE_GEOCODER_POSTGIS_USERNAME'],
      password: process.env['REVERSE_GEOCODER_POSTGIS_PASSWORD'],
      query:
        `
          SELECT pprint_addy(r.addy[1]) AS address,
                 array_to_string(r.street, ',') AS cross_streets,
                 (addy[1]).address AS street_number,
                 (addy[1]).location AS city
          FROM reverse_geocode(ST_GeomFromText('POINT($2 $1)',4326),TRUE) AS r;
        `, // note that spatial coordinates are ordered longitude, latitude in postgis
    },
  },
}

export default config
