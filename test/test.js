var assert = require('power-assert');
var VCPClient = require('../src').VCPClient;
var FetchError = require('../src/fetcher').FetchError;
var config = require('../config/config').config;
var scopes = require('../src/scopes').SCOPES;
var endpoint = config.ENDPOINT;

describe('VCPClient test', function() {
  /*eslint no-inner-declarations:0, no-redeclare:0*/

  this.timeout(10 * 1000); // 10sec

  if (typeof window !== 'undefined') {
    let console_assert = console.assert;
    before(() => {
      // in browser stub console.assert with
      // throwing Error
      console.assert = (exp, message) => {
        if (!exp) {
          throw new Error(message);
        }
      }
    });

    after(() => {
      console.assert = console_assert;
    });
  }

  let params = {
    /*eslint camelcase:0*/
    client_id: config.CLIENT_ID,
    client_secret: config.CLIENT_SECRET,
    username: config.CID,
    password: config.PASSWORD,
    scope: config.SCOPE_LIST,
    grant_type: 'password'
  };

  describe('constructor', () => {
    it('new', () => {
      let client = new VCPClient(endpoint, params);
      assert.deepEqual(client.params, params); // TODO: strictDeepEqual in io.js
      assert.strictEqual(client.endpoint, endpoint);
    });

    it('new without args', () => {
      try {
        let client = new VCPClient();
        assert.fail('cant be here: ' + client);
      } catch(err) {
        assert(err instanceof Error);
        assert.deepEqual(JSON.parse(err.message), ['endpoint is required', 'params is required']);
      }
    });

    it('new without params', () => {
      try {
        let client = new VCPClient(endpoint);
        assert.fail('cant be here: ' + client);
      } catch(err) {
        assert(err instanceof Error);
        assert.deepEqual(JSON.parse(err.message), ['params is required']);
      }
    });

    describe('new with invalid params', () => {
      let copy = (o) => JSON.parse(JSON.stringify(o));

      [
        // client_id
        {
          name: 'without params.client_id',
          params: () => {
            let p = copy(params);
            delete p.client_id;
            return p;
          },
          message: 'params.client_id is required'
        },
        {
          name: 'with empty params.client_id',
          params: () => {
            let p = copy(params);
            p.client_id = '';
            return p;
          },
          message: 'params.client_id is required'
        },
        {
          name: 'with invalid type params.client_id',
          params: () => {
            let p = copy(params);
            p.client_id = 1000;
            return p;
          },
          message: 'params.client_id should be string'
        },

        // client_secret
        {
          name: 'without params.client_secret',
          params: () => {
            let p = copy(params);
            delete p.client_secret;
            return p;
          },
          message: 'params.client_secret is required'
        },
        {
          name: 'with empty params.client_secret',
          params: () => {
            let p = copy(params);
            p.client_secret = '';
            return p;
          },
          message: 'params.client_secret is required'
        },
        {
          name: 'with invalid params.client_secret',
          params: () => {
            let p = copy(params);
            p.client_secret = 1000;
            return p;
          },
          message: 'params.client_secret should be string'
        },
        // username
        {
          name: 'without params.username',
          params: () => {
            let p = copy(params);
            delete p.username;
            return p;
          },
          message: 'params.username is required'
        },
        {
          name: 'with empty params.username',
          params: () => {
            let p = copy(params);
            p.username = '';
            return p;
          },
          message: 'params.username is required'
        },
        {
          name: 'with invalid params.username',
          params: () => {
            let p = copy(params);
            p.username = 1000;
            return p;
          },
          message: 'params.username should be string'
        },
        // password
        {
          name: 'without params.password',
          params: () => {
            let p = copy(params);
            delete p.password;
            return p;
          },
          message: 'params.password is required'
        },
        {
          name: 'with empty params.password',
          params: () => {
            let p = copy(params);
            p.password = '';
            return p;
          },
          message: 'params.password is required'
        },
        {
          name: 'with invalid params.password',
          params: () => {
            let p = copy(params);
            p.password = 1000;
            return p;
          },
          message: 'params.password should be string'
        },
        // scope
        {
          name: 'without params.scope',
          params: () => {
            let p = copy(params);
            delete p.scope;
            return p;
          },
          message: 'params.scope is required'
        },
        {
          name: 'with invalid params.scope',
          params: () => {
            let p = copy(params);
            p.scope = 1000;
            return p;
          },
          message: 'params.scope should be array'
        },
        // grant_type
        {
          name: 'without params.grant_type',
          params: () => {
            let p = copy(params);
            delete p.grant_type;
            return p;
          },
          message: 'params.grant_type is required'
        },
        {
          name: 'with empty params.grant_type',
          params: () => {
            let p = copy(params);
            p.grant_type = '';
            return p;
          },
          message: 'params.grant_type is required'
        },
        {
          name: 'with invalid params.grant_type',
          params: () => {
            let p = copy(params);
            p.grant_type = 1000;
            return p;
          },
          message: 'params.grant_type should be string'
        },
        {
          name: 'with invalid params.proxy',
          params: () => {
            let p = copy(params);
            p.proxy = 'proxy';
            return p;
          },
          message: 'params.proxy should be function'
        }
      ].forEach((p) => {
        it(p.name, () => {

          // node only
          if (typeof window === 'undefined') {
            try {
              let client = new VCPClient(endpoint, p.params());
              assert.fail('cant be here: ' + client);
            } catch (err) {
              assert(err instanceof assert.AssertionError);
              let actual = JSON.parse(err.message);
              let expected = [p.message];
              assert.deepEqual(actual, expected);
            }
          }

          // browser doesn't throw AssertionError
          // but run in node/browser too.
          let consoleassert = console.assert;

          console.assert = function(exp, message) {
            assert.strictEqual(exp, false);
            let actual = JSON.parse(message);
            let expected = [p.message];
            assert.deepEqual(actual, expected);
          }
          let client = new VCPClient(endpoint, p.params());

          console.assert = consoleassert;
        });
      });

    });
  });

  describe('auth', () => {
    it('success', (done) => {
      let client = new VCPClient(endpoint, params);
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
      let p = JSON.parse(JSON.stringify(params));
      p.client_id = 'xxxxxxxx';
      let client = new VCPClient(endpoint, p);
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
      let p = JSON.parse(JSON.stringify(params));
      p.client_secret = 'xxxxxxxx';
      let client = new VCPClient(endpoint, p);
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
      let p = JSON.parse(JSON.stringify(params));
      p.username = 'xxxxxxxx';
      let client = new VCPClient(endpoint, p);
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
      let p = JSON.parse(JSON.stringify(params));
      p.password = 'xxxxxxxx';
      let client = new VCPClient(endpoint, p);
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
      let p = JSON.parse(JSON.stringify(params));
      p.scope = [];
      let client = new VCPClient(endpoint, p);
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
      let p = JSON.parse(JSON.stringify(params));
      p.grant_type = 'xxxxxxxx';
      let client = new VCPClient(endpoint, p);
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
    it('success', (done) => {
      let client = new VCPClient(endpoint, params);
      client.auth().then(() => {
        // any scope with granted are ok
        return client.discovery(scopes.INFORMATION_URI);
      }).then((info) => {
        assert(info);
        done();
      }).catch(done);
    });

    it('error: no result for SCOPE', (done) => {
      let client = new VCPClient(endpoint, params);
      client.auth().then(() => {
        return client.discovery(scopes.AUTH_API);
      }).then((info) => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof Error);
        assert.ok(/discovery result doesn\'t include.*/.test(err.message));
        done();
      });
    });
  });

  describe('accountInfo', () => {
    it('success', (done) => {
      let client = new VCPClient(endpoint, params);
      client.auth().then(() => {
        return client.accountInfo();
      }).then((info) => {
        assert.strictEqual(typeof info.email_verified, 'boolean');
        assert.strictEqual(typeof info.web_password_changed, 'boolean');
        done();
      }).catch(done);
    });
  });

  describe('userInfo', () => {
    it('success', (done) => {
      let client = new VCPClient(endpoint, params);
      client.auth().then(() => {
        return client.userInfo();
      }).then((info) => {
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

  describe('information', (done) => {
    it('success', (done) => {
      let client = new VCPClient(endpoint, params);
      client.auth().then(() => {
        return client.information();
      }).then((info) => {
        assert.strictEqual(typeof info.ja, 'string');
        assert.strictEqual(typeof info.global, 'string');
        done();
      }).catch(done);
    });
  });

  describe('rosters', (done) => {
    it('success', (done) => {
      let client = new VCPClient(endpoint, params);
      client.auth().then(() => {
        return client.rosters();
      }).then((rosters) => {
        assert.ok(Array.isArray(rosters.results));
        assert.strictEqual(typeof rosters.total_results, 'number');
        assert.strictEqual(rosters.total_results, rosters.results.length);
        done();
      }).catch(done);
    });
  });

  describe('roster', (done) => {
    it('success', (done) => {
      let cid;
      let client = new VCPClient(endpoint, params);
      client.auth().then(() => {
        return client.rosters();
      }).then((rosters) => {
        if (rosters.results.length > 0) {
          cid = rosters.results.shift().udc_id;
        } else {
          return done(new Error(`${params.username} doesn't have a roster`));
        }
        return client.roster(cid);
      }).then((roster) => {
        assert.ok(roster);
        assert.strictEqual(roster.udc_id, cid);
        done();
      }).catch(done);
    });

    it('error: non-existent cid', (done) => {
      let cid;
      let client = new VCPClient(endpoint, params);
      client.auth().then(() => {
        return client.roster('invalidCID');
      }).then((roster) => {
        assert.ok(roster);
        assert.strictEqual(roster.udc_id, cid);
        done();
      }).catch((err) => {
        assert.strictEqual(err.length, 1);
        let fetchErr = err[0];
        assert.ok(fetchErr instanceof FetchError);
        assert.strictEqual(fetchErr.message, '存在しないUDC-IDです');
        assert.strictEqual(fetchErr.code, 'roster.error.udcid.notexist');
        done();
      }).catch(done);
    });
  });

  describe('logUpload', (done) => {
    it('success', (done) => {
      let client = new VCPClient(endpoint, params);
      let filename = 'log_upload_test_from_browser';
      let log = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      client.auth().then(() => {
        return client.logUpload(log, filename);
      }).then((result) => {
        assert.strictEqual(result, null);
        done();
      }).catch(done);
    });

    it('cancel', (done) => {
      let client = new VCPClient(endpoint, params);
      let filename = 'log_upload_test_from_browser';
      let log = 'a';
      for (let i = 0; i < 20; i++) {
        log += log;
      }

      client.auth().then(() => {
        let uploadPromise = client.logUpload(log, filename);
        setTimeout(() => {
          uploadPromise.cancel();
        }, 50);

        return uploadPromise;
      }).then((result) => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.message, 'upload canceled');
        done();
      }).catch(done);
    });

    it('error: timeout', (done) => {
      let client = new VCPClient(endpoint, params);
      let filename = 'log_upload_test_from_browser';
      let log = 'a';
      for (let i = 0; i < 20; i++) {
        log += log;
      }

      let timeout = 1;

      client.auth().then(() => {
        return client.logUpload(log, filename, timeout);
      }).then((result) => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.message, `timeout of ${timeout}ms exceeded`);
        done();
      }).catch(done);
    });

    it('error: file size too large', () => {
      let client = new VCPClient(endpoint, params);
      let filename = 'log_upload_test_from_browser';
      let log = 'a';
      for (let i = 0; i < 27; i++) {
        log += log;
      }

      try {
        client.logUpload(log, filename);
      } catch(err) {
        let message = JSON.parse(err.message);
        assert.strictEqual(message.length, 1);
        assert.strictEqual(message[0], 'logfile too big. (API limit 128MB)');
      }
    });

    it('error: invalid file name', () => {
      let client = new VCPClient(endpoint, params);
      let filename = 'test#from%browser';
      let log = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      try {
        client.logUpload(log, filename);
      } catch(err) {
        let message = JSON.parse(err.message);
        assert.strictEqual(message.length, 1);
        assert.strictEqual(message[0], 'invalid log filename. (API limit alphanumeric and -, ., _)');
      }
    });
  });
});
