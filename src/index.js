var URLSearchParams = URLSearchParams || require('urlsearchparams').URLSearchParams;
var scopes = require('./scopes').SCOPES;
var XMLHttpRequest = XMLHttpRequest || require('xmlhttprequest').XMLHttpRequest;

export class FetchError extends Error {
  constructor(message, code) {
    this.message = message;
    this.code = code;
  }
}

class Fetcher {

  constructor() {
    this.events = {};
  }

  emit(name, data) {
    this.events[name].forEach((cb) => {
      cb(data);
    });
  }

  on(name, cb) {
    this.events[name] = this.events[name] || [];
    this.events[name].push(cb);
  }

  off(name, fn) {
    if (arguments.length === 0) {
      delete this.events;
      this.events = {};
      return;
    }

    if (this.events[name] === undefined) {
      return;
    }

    if (fn !== undefined) {
      let index = this.events[name].indexOf(fn);
      if (index > -1) {
        this.events[name].splice(index, 1);
      }
    } else {
      delete this.events[name];
    }
  }

  fetch(url, options) {
    if (url === undefined) {
      throw new Error('url required');
    }

    options = options || {};

    let method = options.method || 'GET';
    let xhr = new XMLHttpRequest();

    xhr.open(method, url);

    // set access_token to Authroization header
    if (options.access_token) {
      xhr.setRequestHeader('Authorization', `Bearer ${options.access_token}`);
    }

    // set content-type to form-urlencoded
    if (options.body) {
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }

    xhr.responseType = 'text';

    return new Promise((done, fail) => {
      xhr.addEventListener('error', fail);

      this.on('cancel', (data) => {
        xhr.abort();
        fail(new Error('upload canceled'));
      });

      xhr.addEventListener('load', () => {
        let status = xhr.status;
        let text = xhr.responseText;
        let json;

        if (/json/.test(xhr.getResponseHeader('content-type'))) {
          json = JSON.parse(text);
        }

        if (status > 399) {
          let message = json.errors[0].message;
          let code = json.errors[0].message_id;
          let err = new FetchError(message, code);
          return fail(err);
        }

        return done(json || text);
      });

      xhr.send(options.body || '');
    });
  }
}

export class Session extends Fetcher {

  constructor(params, endpoint) {
    super();
    this.params = params;
    this.endpoint = endpoint;
  }

  auth() {
    let url = `${this.endpoint}/auth/token`;

    let urlParams = new URLSearchParams();
    Object.keys(this.params).forEach((key) => {
      let value = this.params[key];

      if (key === 'scope') {
        value = value.join(' ');
      }

      urlParams.append(key, value);
    });

    let body = urlParams.toString();

    return this.fetch(url, {
      method: 'POST',
      body: body
    }).then((authInfo) => {
      this.authInfo = authInfo;
      return Promise.resolve();
    });
  }

  discovery(scope) {
    let url = `${this.endpoint}/auth/discovery`;
    let access_token = this.authInfo.access_token;

    let urlParams = new URLSearchParams();
    urlParams.append('scope', scope);

    let body = urlParams.toString();

    return this.fetch(url, {
      method: 'POST',
      access_token: access_token,
      body: body
    }).then(response => {
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
        method: 'GET',
        access_token: access_token
      });
    });
  }

  roster(cid) {
    return this.discovery(scopes.ROSTER_SERVICE_HTTP_API).then((res) => {
      let url = `${res.endpoint}/${this.params.username}/${cid}`;
      let access_token = res.access_token;

      return this.fetch(url, {
        method: 'GET',
        access_token: access_token
      });
    });
  }

  logUpload(log, filename) {
    // API limit is 128MB for logfile
    if (log.length > 1024 * 1024 * 128) {
      throw new Error('logfile too big. (API limit 128MB)');
    }

    if (filename.length > 32 || !/^[a-zA-Z0-9_\-\.]*$/.test(filename)) {
      throw new Error('invalid log filename. (API limit less than 32byte with alpahnumeric and -, ., _)');
    }

    return this.discovery(scopes.LOG_UPLOAD_API).then((res) => {
      let url = res.endpoint;
      url = url.replace('{filename_suffix}', filename);

      return this.fetch(url, {
        method: 'POST',
        body: log,
        access_token: res.access_token
      });
    });
  }

  logUploadCancel() {
    setImmediate(() => {
      this.emit('cancel');
    });
  }
}
