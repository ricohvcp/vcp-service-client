var assert = require('assert');
var scopes = require('./scopes').SCOPES;
var Validator = require('./validator').Validator;
var Fetcher = require('./fetcher').Fetcher;
var Promise = require('bluebird');

export class VCPClient {

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

    this.validator = validator;
    this.endpoint = endpoint;
    this.params = params;
    this.fetcher = new Fetcher(params.proxy);
  }

  auth() {
    let url = `${this.endpoint}/auth/token`;
    let params = this.params;

    return this.fetcher.fetch(url, {
      method: 'post',
      type: 'form',
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

    return this.fetcher.fetch(url, {
      method: 'post',
      type: 'form',
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

      return this.fetcher.fetch(url, {
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

      return this.fetcher.fetch(url, {
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
    this.validator.logUpload.assert({ log, filename, timeout });

    return this.discovery(scopes.LOG_UPLOAD_API).then((res) => {
      let url = res.endpoint;
      url = url.replace('{filename_suffix}', filename);

      return this.fetcher.fetch(url, {
        method: 'post',
        body: log,
        access_token: res.access_token,
        timeout: timeout
      });
    });
  }
}
