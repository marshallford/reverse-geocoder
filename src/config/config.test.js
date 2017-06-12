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
    status200reverseGeocode: {
      type: 'http',
      scope: 'reverse_geocode',
      priority: 1,
      limit: {
        'number': 100,
        'period': 'minute',
      },
      path: 'data',
      key: ' ',
      url: () => 'http://httpstat.us/200',
      timeout: 250,
    },
    status400reverseGeocode: {
      type: 'http',
      scope: 'reverse_geocode',
      priority: 2,
      limit: {
        'number': 100,
        'period': 'minute',
      },
      path: 'data',
      key: ' ',
      url: () => 'http://httpstat.us/400',
      timeout: 250,
    },
    status200speedLimit: {
      type: 'http',
      scope: 'speed_limit',
      priority: 1,
      limit: {
        'number': 100,
        'period': 'minute',
      },
      path: 'data',
      key: ' ',
      url: () => 'http://httpstat.us/200',
      timeout: 250,
    },
    status400speedLimit: {
      type: 'http',
      scope: 'speed_limit',
      priority: 2,
      limit: {
        'number': 100,
        'period': 'minute',
      },
      path: 'data',
      key: ' ',
      url: () => 'http://httpstat.us/400',
      timeout: 250,
    },
  },
}

export default config
