var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var superagent = require('superagent');
var Violate = require('violations').Violate;
var Promise = require('bluebird');

var scopes = require('./scopes').SCOPES;

export class FetchError extends Error {
  constructor(message, code) {
    super(message);
    this.message = message;
    this.code = code;
  }
}

export class Fetcher extends EventEmitter {
  constructor(proxy) {
    super();
    this.proxy = proxy;
  }

  fetch(url, options = {}) {
    assert(url, 'url required');

    let method = options.method || 'get';
    let req = superagent[method](url);

    // wrap with vcp-service-client-proxy
    // (based on superagent-proxy)
    if (this.proxy) {
      this.proxy(req);
    }

    let timeout = options.timeout || 10000;
    req.timeout(timeout);

    // set access_token to Authroization header
    if (options.access_token) {
      req.set('Authorization', `Bearer ${options.access_token}`);
    }

    // set content-type to form-urlencoded
    if (options.body) {
      if (typeof options.body === 'object') {
        req.type('form');
      }
      req.send(options.body);
    }

    return new Promise((resolve, reject) => {
      req.end((err, res) => {
        // in superagent, error has response in 4xx, 5xx
        // so avoid reject(err) below and
        // merge into same flow for create error mesasge below.
        if (err && err.response) {
          res = err.response;
          err = null;
        }

        if (err) {
          return reject(err);
        }

        let status = res.status;
        let header = res.header;
        let body = res.text;

        // in some case, body has '' (emtpy string), so replace them into null
        if (header['content-length'] === undefined || header['content-length'] === '0') {
          body = null;
        }

        // in plain/text, res.text is body but
        // in application/json, res.body is parsed json
        if (header['content-type'].match(/application\/json/)) {
          body = res.body;
        }

        if (status > 399) {
          let message, code;

          if (body.error !== undefined) {
            // single error
            message = body.error_description;
            code = body.error;
          } else if (body.errors !== undefined) {
            // multiple error
            // but use only first.
            message = body.errors[0].message;
            code = body.errors[0].message_id;
          } else {
            // in vcp services, in error status must has
            // error message in response body
            // so we can't do nothing in here
            throw new Error('cant be here: error = ' + message);
          }

          let fetchErr = new FetchError(message, code);
          return reject(fetchErr);
        }

        return resolve(body);
      });
    }).cancellable().catch(Promise.CancellationError, () => {
      // req.abort() blocks for returning TimeouError to req.end
      // so make it async and reject promise first
      setTimeout(() => {
        req.abort();
      }, 0);
      throw new Error('upload canceled');
    });
  }
}

export class Validator {
  constructor() {
    this.new = this.buildNew();
    this.logupload = this.buildLogupload();
  }

  buildNew() {
    let paramRule = {
      'client_id': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `params.${name} is required`;
        }

        if (!_.isString(val)) {
          return `params.${name} should be string`;
        }
      },

      'client_secret': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `params.${name} is required`;
        }

        if (!_.isString(val)) {
          return `params.${name} should be string`;
        }
      },

      'username': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `params.${name} is required`;
        }

        if (!_.isString(val)) {
          return `params.${name} should be string`;
        }
      },

      'password': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `params.${name} is required`;
        }

        if (!_.isString(val)) {
          return `params.${name} should be string`;
        }
      },

      'scope': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `params.${name} is required`;
        }

        if (!_.isArray(val)) {
          return `params.${name} should be array`;
        }
      },

      'grant_type': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `params.${name} is required`;
        }

        if (!_.isString(val)) {
          return `params.${name} should be string`;
        }
      },

      'proxy': (val, name, _) => {
        if (_.isEmpty(val)) {
          return; // optional
        }

        if (!_.isFunction(val)) {
          return `params.${name} should be function`;
        }
      }
    };

    let rules = {
      'endpoint': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `${name} is required`;
        }

        if (!_.isString(val)) {
          return `${name} should be string`;
        }
      },

      'params': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `${name} is required`;
        }

        if (!_.isObject(val)) {
          return `${name} should be object`;
        }

        let paramValidate = new Violate(paramRule);
        return paramValidate.validate(val);
      }
    };

    return new Violate(rules);
  }

  buildLogupload() {
    let rules = {
      'log': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `${name} is required`;
        }

        if (val.length >= 1024 * 1024 * 128) {
          return 'logfile too big. (API limit 128MB)';
        }
      },
      'filename': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `${name} is required`;
        }

        let messages = [];
        if (val.length > 32) {
          // API limit for logfile name
          messages.push('logfile name too large. (API limit less than 32byte )');
        }

        if (!/^[a-zA-Z0-9_\-\.]+$/.test(val)) {
          // API limit is limit for logfile size
          messages.push('invalid log filename. (API limit alphanumeric and -, ., _)');
        }

        return messages;
      },
      'timeout': (val, name, _) => {
        if (_.isEmpty(val)) {
          return; // optional
        }

        if (!_.isNumber(val)) {
          return `${name} should be Number`;
        }
      }
    };

    return new Violate(rules);
  }
}

export class VCPClient extends Fetcher {

  /**
   * @constructor
   * @param {String} endpoint - endpoint url string for Auth API
   * @param {Object} params - parameter for Auth API
   * @param {String} params.client_id - client_id of client app
   * @param {String} params.client_secret - client_secret of client app
   * @param {String} params.username - CID of user
   * @param {String} params.password - password of user
   * @param {String[]} params.scope - list of scope string
   * @param {String} params.grant_type - grant_type of API
   */
  constructor(endpoint, params) {
    let validator = new Validator();
    validator.new.assert({ endpoint, params });

    super(params.proxy);
    this.validator = validator;
    this.endpoint = endpoint;
    this.params = params;
  }

  auth() {
    let url = `${this.endpoint}/auth/token`;
    let params = this.params;

    return this.fetch(url, {
      method: 'post',
      body: { // copy params for join scope
        client_id: params.client_id,
        client_secret: params.client_secret,
        username: params.username,
        password: params.password,
        scope: params.scope.join(' '),
        grant_type: params.grant_type
      }
    }).then((authInfo) => {
      this.authInfo = authInfo;
      return Promise.resolve();
    });
  }

  discovery(scope) {
    assert(scope, 'scope is required');

    let url = `${this.endpoint}/auth/discovery`;
    let access_token = this.authInfo.access_token;

    return this.fetch(url, {
      method: 'post',
      access_token: access_token,
      body: { scope: scope }
    }).then((response) => {
      if (response[scope] === undefined) {
        throw new Error(`discovery result doesn't include ${scope} field: ${JSON.stringify(response)}`);
      }
      return response[scope];
    });
  }

  accountInfo() {
    return this.discovery(scopes.GD_ACCOUNT_INFO_QUERY);
  }

  userInfo() {
    return this.discovery(scopes.USERINFO_QUERY);
  }

  information() {
    return this.discovery(scopes.INFORMATION_URI);
  }

  rosters() {
    return this.discovery(scopes.ROSTER_SERVICE_HTTP_API).then((res) => {
      let url = `${res.endpoint}/${this.params.username}`;
      let access_token = res.access_token;

      return this.fetch(url, {
        method: 'get',
        access_token: access_token
      });
    });
  }

  roster(cid) {
    assert(cid, 'cid is required');

    return this.discovery(scopes.ROSTER_SERVICE_HTTP_API).then((res) => {
      let url = `${res.endpoint}/${this.params.username}/${cid}`;
      let access_token = res.access_token;

      return this.fetch(url, {
        method: 'get',
        access_token: access_token
      });
    });
  }

  /**
   * upload log with Log Upload API.
   * `log` will upload and save on log server with `filename`
   *
   * @param {String} log - log data for upload
   * @param {String} filename - filename of uploaded log
   * @param {Number} [timeout=1000ms] - number for uploading timeout in milli second
   * @returns {Promise} resolve when upload finished, reject otherwise
   */
  logUpload(log, filename, timeout = 10000) {
    this.validator.logupload.assert({ log, filename, timeout });

    return this.discovery(scopes.LOG_UPLOAD_API).then((res) => {
      let url = res.endpoint;
      url = url.replace('{filename_suffix}', filename);

      return this.fetch(url, {
        method: 'post',
        body: log,
        access_token: res.access_token,
        timeout: timeout
      });
    });
  }

  /**
   * canceling log upload
   * and resolve promise of logUpload()
   *
   * @returns {undefined} no return
   */
  logUploadCancel() {
    this.emit('cancel');
  }
}
