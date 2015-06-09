var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var superagent = require('superagent');
var Promise = require('bluebird');

export class FetchError extends Error {
  constructor(message, code) {
    super(message);
    this.message = message;
    this.code = code;
  }
}

// TODO: support progress
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
    if (options.type) {
      req.type(options.type);
    }

    req.send(options.body);

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
          // single error
          if (body.error !== undefined) {
            let message = body.error_description;
            let code = body.error;
            let fetchError = new FetchError(message, code);
            return reject(fetchError);
          }

          // multiple error
          if (body.errors !== undefined) {
            let fetchErrors = body.errors.map((error) => {
              let message = error.message;
              let code = error.message_id;
              return new FetchError(message, code);
            });

            // reject with Array of FetchError
            return reject(fetchErrors);
          }

          // in vcp services, in error status must has
          // error message in response body
          // so we can't do nothing in here
          return reject(new Error(`cant be here: status=${status} body=${body}`));
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
