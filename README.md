# Reverse Geocode RESTful API

[![license](https://img.shields.io/github/license/marshallford/reverse-geocoder.svg)]()
[![Build Status](https://travis-ci.org/marshallford/reverse-geocoder.svg?branch=master)](https://travis-ci.org/marshallford/reverse-geocoder)

* Supports multiple reverse-geocode providers
* Supports speed limit lookups (currently only via google)
* Caching via Redis
* Decent error handling
* HTTP and PostgreSQL providers
* Check system status via `GET: /api/v1/status`
* Skip over cache with `?skipCache=true`
* Replace cache with `?replaceCache=true`
* Test all providers with `?allProviders=true`

## Getting started

* `npm install`
* `npm run dev` or `npm start` for production mode
* `POST: http://localhost:8080/api/v1/reverse-geocode`
* `POST: http://localhost:8080/api/v1/speed-limit`


## Information

### Example request

The reverse-geocode and speed-limit endpoints both take the same input:

```json
{
  "lat": 46,
  "lng": -96
}
```

### Example response

#### reverse-geocode

```json
{
  "input": {
    "lat": 46.86675,
    "lng": -96.79474
  },
  "output": "948-998 8th Ave S, Fargo, ND 58103, USA",
  "extras": {
    "street_number": "948-998",
    "route": "8th Avenue South",
    "neighborhood": "Hawthorne",
    "locality": "Fargo",
    "county": "Cass County",
    "state": "North Dakota",
    "country": "United States",
    "zip_code": "58103",
    "location": "Fargo, North Dakota, United States"
  },
  "date_retrieved": "2017-06-12T19:55:28.018Z",
  "provider": "google",
  "errors": [
    "postgis: could not connect to provider"
  ]
}
```

#### speed-limit

``` json
{
  "input": {
    "lat": 46.86675,
    "lng": -96.79474
  },
  "output": {
    "placeId": "ChIJpZOQ0-LLyFIRvmnyMbeiQNw",
    "speedLimit": 25,
    "units": "MPH"
  },
  "extras": {},
  "date_retrieved": "2017-06-12T19:54:58.749Z",
  "provider": "googleroads",
  "errors": []
}
```


### Example Status

```json
{
  "uptime": "2 minutes",
  "keys": 8,
  "providers": {
    "reverse_geocode": [
      "postgis",
  		"google",
  		"openstreetmap"
  	],
  	"speed_limit": [
      "googleroads"
  	]
  },
  "routes": [
    "/status",
    "/reverse-geocode",
    "/speed-limit"
  ],
  "stats": {
    "lookups": {
      "reverse_geocode": {
        "google": 5
      },
      "speed_limit": {
        "googleroads": 4
      }
    }
  },
  "version": "2.0.0",
  "redis": "see: https://github.com/NodeRedis/node_redis#clientserver_info"
}
```

### General configuration options

See `src/config/config.sample.js` for an example of a typical configuration.

|Key|Description|
|---|-----------|
|`truncate`|number of decimal points to truncate off the lat and long|
|`log`|`0`: no info logging, `1`: per request logging, `2`: per request logging + per provider messages|
|`redis.options`|[redis options](https://github.com/NodeRedis/node_redis#options-object-properties)|
|`redis.ttl`|time to live for redis keys|
|`port`|the port that express (http) will listen on|
|`cors`|enable cross-origin resource sharing, `true` or `false`|
|`stats.redisKey`|the Redis key used to store the app's stats|

### Provider setup

|Provider key|Type|Description|
|------------|----|-----------|
|`type`|`all`|type of provider, current options: `http`, `pg`|
|`scope`|`all`|scope of provider, current options: `reverse_geocode`, `speed_limit`|
|`limit`|`all`|object containing rate limiting value and time period|
|`priority`|`all`|signifies the order in which providers will be used in scope. A value of `0` will disable the provider, `1` is the highest priority|
|`path`|`all`|the dot notation path of where the address is in the response|
|`extrasPath`|`all`|the dot notation path of where the extras are in the response|
|`extras`|`all`|map of extra meta data to include with result (like county, township, etc)|
|`failures`|`all`|array of dot notation paths, if these keys are undefined or empty, the provider will be skipped|
|`url`|`http`|API url to consume|
|`key`|`http`|API key used to consume the provider|
|`timeout`|`http`|number of milliseconds before the request times out|
|`host`|`pg`|PostgreSQL install location|
|`port`|`pg`|port that PostgreSQL is running on|
|`database`|`pg`|PostgreSQL database name|
|`user`|`pg`|PostgreSQL username|
|`password`|`pg`|PostgreSQL password|
|`sql`|`pg`|a map with two keys, the query to run and the params to pass|

### Running in production

```
npm start
```

To run in production I recommend [Supervisor](http://supervisord.org/) to manage the Node processes. This app utilizes [Node clustering](https://nodejs.org/api/cluster.html) so using a process manager that forks automagically like [PM2](https://github.com/Unitech/pm2) is overkill and will probably break the app.


#### Example Supervisor config

```
[program:reverse-geocoder]
directory=/home/ubuntu/reverse-geocoder
command=npm start
autostart=true
autorestart=true
environment=REVERSE_GEOCODER_CORS=false,REVERSE_GEOCODER_GOOGLE_API_KEY={KEY HERE},REVERSE_GEOCODER_POSTGIS_USERNAME={USERNAME HERE},REVERSE_GEOCODER_POSTGIS_PASSWORD={PASSWORD HERE}
stderr_logfile=/var/log/reverse-geocoder.err.log
stdout_logfile=/var/log/reverse-geocoder.out.log
user=ubuntu
stopasgroup=true
```

As far as installing Node is concerned, I suggest using the [NodeSource repositories](https://github.com/nodesource/distributions) to get the latest version. Lastly, the app does require a Redis instance to cache results, you can change the Redis connection config via the `redis.options` key.

## Bugs?

* The lookup stat for each provider is incremented only if that provider returns a valid lookup

## TODO

* Throttling per provider
* File based provider/offline support
