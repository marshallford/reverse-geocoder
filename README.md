# Reverse Geocode REST API

* Supports multiple providers
* Caching via Redis
* Decent error handling
* HTTP and PostgreSQL providers
* Check system status via `/status`
* Skip over cache with `?skipCache=true`

## Getting started

* `npm install`
* set `REVERSE_GEOCODER_GOOGLE_API_KEY` env var
* set `REVERSE_GEOCODER_LOG` env var to `true` for logging
* `npm run dev`
* POST to `http://localhost:8080/api/v1/reverse-geocode`


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

### General configuration options

|Key|Description|
|---|-----------|
|`truncate`|number of decimal points to truncate off the lat and long|
|`log`|enable logging, `true` or `false`|
|`redis`|redis options hash|

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
|`host`|`pg`|PostgreSQL install location|
|`port`|`pg`|port that PostgreSQL is running on|
|`db`|`pg`|PostgreSQL database name|
|`username`|`pg`|PostgreSQL username|
|`password`|`pg`|PostgreSQL password|
|`query`|`pg`|query to run on the database|

## TODO

* Throttling per provider
* File based provider/offline support
