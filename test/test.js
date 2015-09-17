/* eslint max-len: 0, no-invalid-this: 0 */
const assert = require('power-assert');
const AssertionError = require('violations').AssertionError;
const VCPClient = require('../src').VCPClient;
const FetchError = require('../src/fetcher').FetchError;
const config = require('../config/config').config;
const scopes = require('../src/scopes').SCOPES;
const endpoint = config.ENDPOINT;

describe('VCPClient test', function() {
  this.timeout(10 * 2000); // 20sec

  const params = {
    client_id: config.CLIENT_ID,
    client_secret: config.CLIENT_SECRET,
    username: config.CID,
    password: config.PASSWORD,
    scope: config.SCOPE_LIST,
    grant_type: 'password',
  };

  describe('constructor', () => {
    it('new', () => {
      const client = new VCPClient(endpoint, params);
      assert.deepEqual(client.params, params);
      assert.strictEqual(client.endpoint, endpoint);
    });

    it('new without args', () => {
      try {
        const client = new VCPClient();
        assert.fail(`cant be here: ${client}`);
      } catch (err) {
        assert(err instanceof AssertionError);
        assert.deepEqual(JSON.parse(err.message), ['endpoint is required', 'params is required']);
      }
    });

    it('new without params', () => {
      try {
        const client = new VCPClient(endpoint);
        assert.fail(`cant be here: ${client}`);
      } catch (err) {
        assert(err instanceof AssertionError);
        assert.deepEqual(JSON.parse(err.message), ['params is required']);
      }
    });
  });

  describe('auth', () => {
    it('success', (done) => {
      const client = new VCPClient(endpoint, params);
      client.auth().then(() => {
        assert.ok(client.authInfo.access_token);
        assert.ok(client.authInfo.refresh_token);
        assert.ok(client.authInfo.token_type);
        assert.ok(client.authInfo.expires_in);
        assert.ok(client.authInfo.scope);
        done();
      }).catch(done);
    });

    it('error: param with invalid client_id', (done) => {
      const p = JSON.parse(JSON.stringify(params));
      p.client_id = 'xxxxxxxx';
      const client = new VCPClient(endpoint, p);
      client.auth().then(() => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof FetchError);
        assert.ok(/The client identifier provided is invalid.*/.test(err.message));
        assert.strictEqual(err.code, 'invalid_client');
        done();
      }).catch(done);
    });

    it('error: param with invalid client_secret', (done) => {
      const p = JSON.parse(JSON.stringify(params));
      p.client_secret = 'xxxxxxxx';
      const client = new VCPClient(endpoint, p);
      client.auth().then(() => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof FetchError);
        assert.ok(/The client identifier provided is invalid.*/.test(err.message));
        assert.strictEqual(err.code, 'invalid_client');
        done();
      }).catch(done);
    });

    it('error: param with invalid username', (done) => {
      const p = JSON.parse(JSON.stringify(params));
      p.username = 'xxxxxxxx';
      const client = new VCPClient(endpoint, p);
      client.auth().then(() => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof FetchError);
        assert.ok(/The provided access grant is invalid, expired, or revoked.*/.test(err.message));
        assert.strictEqual(err.code, 'invalid_grant');
        done();
      }).catch(done);
    });

    it('error: param with invalid password', (done) => {
      const p = JSON.parse(JSON.stringify(params));
      p.password = 'xxxxxxxx';
      const client = new VCPClient(endpoint, p);
      client.auth().then(() => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof FetchError);
        assert.ok(/The provided access grant is invalid, expired, or revoked.*/.test(err.message));
        assert.strictEqual(err.code, 'invalid_grant');
        done();
      }).catch(done);
    });

    it('error: param with invalid scope', (done) => {
      const p = JSON.parse(JSON.stringify(params));
      p.scope = [];
      const client = new VCPClient(endpoint, p);
      client.auth().then(() => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof FetchError);
        assert.ok(/The request is missing a required parameter.*/.test(err.message));
        assert.strictEqual(err.code, 'invalid_request');
        done();
      }).catch(done);
    });

    it('error: param with invalid grant_type', (done) => {
      const p = JSON.parse(JSON.stringify(params));
      p.grant_type = 'xxxxxxxx';
      const client = new VCPClient(endpoint, p);
      client.auth().then(() => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof FetchError);
        assert.ok(/The access grant included - its type or another attribute - is not supported by the authorization server..*/.test(err.message));
        assert.strictEqual(err.code, 'unsupported_grant_type');
        done();
      }).catch(done);
    });
  });

  describe('discovery', () => {
    let client;

    before((done) => {
      client = new VCPClient(endpoint, params);
      client.auth().then(done, done);
    });

    it('success', (done) => {
      // any scope with granted are ok
      client.discovery(scopes.INFORMATION_URI).then((info) => {
        assert(info);
        done();
      }).catch(done);
    });

    it('error: no result for SCOPE', (done) => {
      client.discovery(scopes.AUTH_API).then((info) => {
        assert.fail(`cant be here: ${info}`);
      }).catch((err) => {
        assert.ok(err instanceof Error);
        assert.ok(/discovery result doesn\'t include.*/.test(err.message));
        done();
      }).catch(done);
    });
  });

  describe('accountInfo', () => {
    let client;

    before((done) => {
      client = new VCPClient(endpoint, params);
      client.auth().then(done, done);
    });

    it('success', (done) => {
      client.accountInfo().then((info) => {
        assert.strictEqual(typeof info.email_verified, 'boolean');
        assert.strictEqual(typeof info.web_password_changed, 'boolean');
        done();
      }).catch(done);
    });
  });

  describe('userInfo', () => {
    let client;

    before((done) => {
      client = new VCPClient(endpoint, params);
      client.auth().then(done, done);
    });

    it('success', (done) => {
      client.userInfo().then((info) => {
        assert.strictEqual(info.type, 'account');
        assert.strictEqual(typeof info.id, 'number');
        assert.strictEqual(typeof info.display_name, 'string');
        assert.strictEqual(typeof info.email, 'string');
        assert.strictEqual(typeof info.link, 'string');
        assert.strictEqual(info.udc_id, params.username);
        done();
      }).catch(done);
    });
  });

  describe('information', () => {
    let client;

    before((done) => {
      client = new VCPClient(endpoint, params);
      client.auth().then(done, done);
    });

    it('success', (done) => {
      client.information().then((info) => {
        assert.strictEqual(typeof info.ja, 'string');
        assert.strictEqual(typeof info.global, 'string');
        done();
      }).catch(done);
    });
  });

  describe('logUpload', () => {
    let client;

    const largelog = new Array(1024).join('a');

    before((done) => {
      client = new VCPClient(endpoint, params);
      client.auth().then(done, done);
    });

    it('success', (done) => {
      const filename = 'log_upload_test_from_browser';
      const log = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      client.logUpload(log, filename).then((result) => {
        assert.strictEqual(result, null);
        done();
      }).catch(done);
    });

    it('cancel', (done) => {
      const filename = 'log_upload_test_from_browser';

      const uploadPromise = client.logUpload(largelog, filename);

      setTimeout(() => {
        uploadPromise.cancel();
      }, 1);

      uploadPromise.then((result) => {
        assert.fail(`cant be here: ${result}`);
      }).catch((err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.message, 'upload canceled');
        done();
      }).catch(done);
    });

    it('error: timeout', (done) => {
      const filename = 'log_upload_test_from_browser';

      const timeout = 1;

      client.logUpload(largelog, filename, timeout).then((result) => {
        assert.fail(`cant be here: ${result}`);
      }).catch((err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.message, `timeout of ${timeout}ms exceeded`);
        done();
      }).catch(done);
    });

    it('error: file size too large', () => {
      const filename = 'log_upload_test_from_browser';

      client.logUpload(new Array(1024 * 1024 * 128 + 1), filename).catch((err) => {
        const message = JSON.parse(err.message);
        assert.strictEqual(message.length, 1);
        assert.strictEqual(message[0], 'logfile too large. (API limit 128MB)');
      });
    });

    it('error: invalid file name', () => {
      const filename = 'test#from%browser';
      const log = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      client.logUpload(log, filename).catch((err) => {
        const message = JSON.parse(err.message);
        assert.strictEqual(message.length, 1);
        assert.strictEqual(message[0], 'invalid log filename. (API limit alphanumeric and -, ., _)');
      });
    });
  });
});
