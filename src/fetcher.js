var EventEmitter = require('events').EventEmitter;
var superagent = require('superagent');
var Promise = require('bluebird');

/**
 * Class of Custom FetchError
 *
 * @extends {Error}
 * @access public
 */
export class FetchError extends Error {

  /**
   * constructor of this class
   * calling super (Erro constructor) with message.
   *
   * @param {String} message - error message
   * @param {String} code - HTTP status code
   */
  constructor(message, code) {
    super(message);
    this.message = message;
    this.code = code;
  }
}

// TODO: support progress
/**
 * Class of Fetcher
 *
 * @extends {EventEmitter}
 * @access public
 */
export class Fetcher extends EventEmitter {

  /**
   * constructor of this class
   * @param {Function} proxy - superagent-proxy
   */
  constructor(proxy) {
    super();
    this.proxy = proxy;
  }

  /**
   * constructor of this class
   * calling super (Erro constructor) with message.
   *
   * @param {String} url - url for fetch
   * @param {Object} options - options for http request
   * @param {String} options.method - HTTP medthod
   * @param {Number} options.timeout - timeout in milli second
   * @param {String} options.access_token - access token for Bearer header
   * @param {String} options.type - content-type
   * @param {String} options.body - request body
   */
  fetch(url, options = {}) {
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
      console.time(url);
      req.end((err, res) => {
        console.timeEnd(url);
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
