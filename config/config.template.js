var SCOPES = require('../src/scopes').SCOPES;

var config = {
  // you client infomation
  CLIENT_ID:     '',
  CLIENT_SECRET: '',

  // your cid infomation
  CID:           '',
  PASSWORD:      '',

  // endpoint of UCS Auth API
  ENDPOINT: '',

  // scopes for required API (see, ../src/scopes.js)
  SCOPE_LIST: [
    SCOPES.AUTH_API,
    SCOPES.DISCOVERY_API,
    SCOPES.LOG_UPLOAD_API
  ]
};

exports.config = config;
