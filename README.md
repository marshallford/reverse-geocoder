# Reverse Geocode REST API

* Supports multiple providers
* Caching via Redis
* Decent error handling

## Getting started

* `npm install`
* `set REVERSE_GEOCODER_GOOGLE_API_KEY env var`
* `npm run dev`
* POST to `http://localhost:8080/api/v1/reverse-geocode`

## TODO

* ~~Throttling per provider~~
* ~~lat & lng truncation~~
* ~~Refactor API, avoid nesting~~
* Postgres/PostGIS as a provider support
* Concurrency throttling
* Fallback on throttle (fallback in general)
