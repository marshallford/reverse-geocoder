const config = {
  providers: {
    google: {
      key: process.env['REVERSE_GEOCODE_GOOGLE_API_KEY'],
      url: (lat, lng, key) => `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`,
      path: 'data.results[0].formatted_address'
    },
    openstreetmap: {
      key: ' ',
      url: (lat, lng, key) => `http://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=0`,
      path: 'data.display_name'
    },
    status400: {
      key: ' ',
      url: () => 'http://httpstat.us/400',
      path: 'data'
    }
  }
}

export default config
