const SCOPES = require('./scopes').SCOPES;
const Validator = require('./validator').Validator;
const Fetcher = require('./fetcher').Fetcher;
const FetchErrors = require('../src/fetcher').FetchErrors;
const Promise = require('bluebird');

/**
 * Class of Client for VCP web service api
 * @access public
 */
export class VCPClient {

  /**
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
    const validator = new Validator();
    validator.new.assert({ endpoint, params });

    this.validator = validator;
    this.endpoint = endpoint;
    this.params = params;
    this.fetcher = new Fetcher(params.proxy);
  }

  /**
   * call auth API.
   *
   * @returns {Promise} resolve when auth info fetched, reject otherwise
   */
  auth() {
    const url = `${this.endpoint}/auth/token`;
    const params = this.params;

    return this.fetcher.fetch(url, {
      method: 'post',
      type:   'form',
      body:   { // copy params for join scope
        client_id:     params.client_id,
        client_secret: params.client_secret,
        username:      params.username,
        password:      params.password,
        scope:         params.scope.join(' '),
        grant_type:    params.grant_type,
      },
    }).then((authInfo) => {
      this.authInfo = authInfo;
      return Promise.resolve();
    });
  }

  /**
   * call discovery API with given scope.
   *
   * @param {String|String[]} scopes - scope or SCOPES for discovery
   * @returns {Promise} resolve when discovery result fetched, reject otherwise
   */
  discovery(scopes) {
    const url = `${this.endpoint}/auth/discovery`;
    const access_token = this.authInfo.access_token;

    // make single scope to single element array
    const scope_list = Array.isArray(scopes) ? scopes : [scopes];

    return this.fetcher.fetch(url, {
      method:       'post',
      type:         'form',
      access_token: access_token,
      body:         { scope: scope_list.join(' ') },
    }).then((response) => {
      const errors = scope_list.reduce((pre, curr) => {
        if (response[curr] === undefined) {
          const err = new Error(`discovery result doesn't include ${curr} field: ${JSON.stringify(response)}`);
          pre.push(err);
        }
        return pre;
      }, []);

      if (errors.length > 0) {
        return Promise.reject(new FetchErrors('discovery errors', errors));
      }

      return response;
    });
  }

  /**
   * get Account Info using Aoount Info Query API.
   *
   * @returns {Promise} resolve when account info fetched, reject otherwise
   */
  accountInfo() {
    return this.discovery(SCOPES.GD_ACCOUNT_INFO_QUERY);
  }

  /**
   * get User Info using User Info Query API.
   *
   * @returns {Promise} resolve when user info fetched, reject otherwise
   */
  userInfo() {
    return this.discovery(SCOPES.USERINFO_QUERY);
  }

  /**
   * get Infomation using Information API.
   *
   * @returns {Promise} resolve when infomation fetched, reject otherwise
   */
  information() {
    return this.discovery(SCOPES.INFORMATION_URI);
  }

  /**
   * get Roster using Roster Web API.
   * if `cid` was specified, get the roster of that cid,
   * and if not specified, get the list of all roster.
   *
   * @param {String} cid - cid of roster
   * @returns {Promise} resolve when roster info fetched, reject otherwise
   */
  getRoster(cid) {
    return this.discovery(SCOPES.ROSTER_SERVICE_HTTP_API).then((res) => {
      let url = `${res.endpoint}/${this.params.username}`;

      if (cid !== undefined) {
        url = `${url}/${cid}`;
      }

      const access_token = res.access_token;

      return this.fetcher.fetch(url, {
        method:       'get',
        access_token: access_token,
      });
    });
  }

  /**
   * add Roster using Roster Web API.
   *
   * @param {String} cid - cid of roster
   * @param {Object} params - parameter for Roster API
   * @param {String} params.name - name of roster
   * @param {String} params.kana - kana of roster
   * @param {String} params.sender_name - name of sender
   * @param {String} params.sender_name_kana - kana of sender
   * @returns {Promise} resolve when roster result fetched, reject otherwise
   */
  addRoster(cid, options = {}) {
    return this.discovery(SCOPES.ROSTER_SERVICE_HTTP_API).then((res) => {
      this.validator.addContact.assert(options);

      const body = options;
      body.udc_id = cid;

      const url = `${res.endpoint}/${this.params.username}`;
      const access_token = res.access_token;

      return this.fetcher.fetch(url, {
        method:       'post',
        type:         'json',
        access_token: access_token,
        body:         body,
      });
    });
  }

  /**
   * update Roster using Roster Web API.
   *
   * @param {String} cid - cid of roster
   * @param {Object} params - parameter for Roster API
   * @param {String} params.name - name of roster
   * @param {String} params.kana - kana of roster
   * @param {String} params.sender_name - name of sender
   * @param {String} params.sender_name_kana - kana of sender
   * @returns {Promise} resolve when roster result fetched, reject otherwise
   */
  updateRoster(cid, options = {}) {
    return this.discovery(SCOPES.ROSTER_SERVICE_HTTP_API).then((res) => {
      const url = `${res.endpoint}/${this.params.username}/${cid}`;
      const access_token = res.access_token;

      return this.fetcher.fetch(url, {
        method:       'put',
        type:         'json',
        access_token: access_token,
        body:         options,
      });
    });
  }

  /**
   * delete Roster using Roster Web API.
   * if `cid` was specified, get the roster of that cid,
   * and if not specified, get the list of all roster.
   *
   * @param {String} cid - cid of roster
   * @returns {Promise} resolve when roster info fetched, reject otherwise
   */
  deleteRoster(cid) {
    return this.discovery(SCOPES.ROSTER_SERVICE_HTTP_API).then((res) => {
      const url = `${res.endpoint}/${this.params.username}/${cid}`;
      const access_token = res.access_token;

      return this.fetcher.fetch(url, {
        method:       'del',
        access_token: access_token,
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
    return this.discovery(SCOPES.LOG_UPLOAD_API).then((res) => {
      this.validator.logUpload.assert({ log, filename, timeout });

      let url = res.endpoint;
      url = url.replace('{filename_suffix}', filename);

      return this.fetcher.fetch(url, {
        method:       'post',
        body:         log,
        access_token: res.access_token,
        timeout:      timeout,
      });
    });
  }
}
