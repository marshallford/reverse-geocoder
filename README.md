# Reverse Geocode RESTful API

* Supports multiple providers
* Caching via Redis
* Decent error handling
* HTTP and PostgreSQL providers
* Check system status via `GET: /api/v1/status`
* Skip over cache with `?skipCache=true`

## Getting started

* `npm install`
* `npm run dev` or `npm start` for production mode
* `POST: http://localhost:8080/api/v1/reverse-geocode`


## Information

### Example request

```json
{
  "lat": 46,
  "lng": -96
}
```

### Example response

```json
{
  "input": {
    "lat": 46,
    "lng": -96
  },
  "output": "26501-26599 210th Ave, Elbow Lake, MN 56531, USA",
  "date_retrieved": "2016-06-17T16:11:40.741Z",
  "provider": "google",
  "errors": [
    "postgis: could not connect to provider"
  ]
}
```

### Example Status

```json
{
  "uptime": "a few seconds",
  "keys": 7,
  "providers": [
    "postgis",
    "google",
    "openstreetmap"
  ],
  "routes": [
    "/status",
    "/reverse-geocode"
  ],
  "stats": {
    "lookups": {
      "google": 14,
      "postgis": 2
    }
  },
  "version": "1.1.1",
  "redis": "see: https://github.com/NodeRedis/node_redis#clientserver_info"
}
```

### General configuration options

|Key|Description|
|---|-----------|
|`truncate`|number of decimal points to truncate off the lat and long|
|`log`|`0`: no info logging, `1`: per request logging, `2`: per request logging + per provider messages|
|`redis`|redis [options](https://github.com/NodeRedis/node_redis#options-object-properties)|
|`cors`|enable cross-origin resource sharing, `true` or `false`|
|`stats.redisKey`|the Redis key used to store the app's stats|
|`stats.default`|the base stats value if the stats key doesn't exist|

### Provider setup

|Provider key|Type|Description|
|------------|----|-----------|
|`type`|`all`|type of provider, current options: `http`, `pg`|
|`limit`|`all`|object containing rate limiting value and time period|
|`priority`|`all`|signifies the order in which providers will be used. A value of `0` will disable the provider, `1` is the highest priority|
|`path`|`all`|the dot notation path of where the address is in the response|
|`failures`|`all`|array of dot notation paths, if these keys are undefined or empty, the provider will be skipped|
|`url`|`http`|API url to consume|
|`key`|`http`|API key used to consume the provider|
|`timeout`|`http`|number of milliseconds before the request times out|
|`host`|`pg`|PostgreSQL install location|
|`port`|`pg`|port that PostgreSQL is running on|
|`db`|`pg`|PostgreSQL database name|
|`username`|`pg`|PostgreSQL username|
|`password`|`pg`|PostgreSQL password|
|`query`|`pg`|query to run on the database|

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

As far as installing Node is concerned, I suggest using the [NodeSource repositories](https://github.com/nodesource/distributions) to get the latest version. Lastly, the app does require a Redis instance to cache results, you can change the Redis connection config via the `redis` key in `config.js`.

## Bugs?

* The lookup stat for each provider is incremented only if that provider returns a valid lookup

## TODO

* Throttling per provider
* File based provider/offline support
