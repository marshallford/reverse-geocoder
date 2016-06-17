# Reverse Geocode REST API

* Supports multiple providers
* Caching via Redis
* Decent error handling
* HTTP and PostgreSQL providers
* Check system status via `/status`
* Skip over cache with `?skipCache=true`

## Getting started

* `npm install`
* `set REVERSE_GEOCODER_GOOGLE_API_KEY env var`
* `npm run dev`
* POST to `http://localhost:8080/api/v1/reverse-geocode`

## TODO

* Throttling per provider
