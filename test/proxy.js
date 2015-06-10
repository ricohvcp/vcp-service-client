/*eslint process-env: 0, no-process-env: 0*/
var assert = require('power-assert');
var Proxy = require('vcp-service-client-proxy');

var VCPClient = require('../src').VCPClient;
var Fetcher = require('../src/fetcher').Fetcher;
var config = require('../config/config').config;
var endpoint = config.ENDPOINT;

describe('Fetcher test', function() {
  this.timeout(10 * 1000); // 10sec

  describe('implicit proxy', () => {
    let proxy = Proxy();
    let fetcher = new Fetcher(proxy);

    it('http', (done) => {
      fetcher.fetch('http://example.com').then((res) => {
        assert.strictEqual(typeof res, 'string');
        done();
      }).catch(done);
    });

    it('https', (done) => {
      fetcher.fetch('https://example.com').then((res) => {
        assert.strictEqual(typeof res, 'string');
        done();
      }).catch(done);
    });
  });

  describe('explicit proxy', () => {
    let proxy = Proxy({
      http: process.env.HTTP_PROXY,
      https: process.env.HTTPS_PROXY
    });

    let fetcher = new Fetcher(proxy);

    it('http', (done) => {
      fetcher.fetch('http://example.com').then((res) => {
        assert.strictEqual(typeof res, 'string');
        done();
      }).catch(done);
    });

    it('https', (done) => {
      fetcher.fetch('https://example.com').then((res) => {
        assert.strictEqual(typeof res, 'string');
        done();
      }).catch(done);
    });
  });

  describe('VCPClient', () => {
    let params = {
      client_id: config.CLIENT_ID,
      client_secret: config.CLIENT_SECRET,
      username: config.CID,
      password: config.PASSWORD,
      scope: config.SCOPE_LIST,
      grant_type: 'password',
      proxy: Proxy()
    };

    it('auth', (done) => {
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
  });
});
