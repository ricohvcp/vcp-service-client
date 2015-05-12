var assert = require('power-assert');
var Fetcher = require('../src').Fetcher;
var Proxy = require('vcp-service-client-proxy');

describe('Fetcher test', function() {
  this.timeout(10 * 1000); // 10sec

  describe('implicit proxy', () => {
    let proxy = Proxy();

    it('http', (done) => {
      let fetcher = new Fetcher(proxy);

      fetcher.fetch('http://example.com').then((res) => {
        assert.strictEqual(typeof res, 'string');
        done();
      }).catch(console.log.bind(console));
    });

    it('https', (done) => {
      let fetcher = new Fetcher(proxy);

      fetcher.fetch('https://example.com').then((res) => {
        assert.strictEqual(typeof res, 'string');
        done();
      }).catch(console.log.bind(console));
    });
  });

  describe('explicit proxy', () => {
    let proxy = Proxy({
      http: process.env.HTTP_PROXY,
      https: process.env.HTTPS_PROXY
    });

    it('http', (done) => {
      let fetcher = new Fetcher(proxy);

      fetcher.fetch('http://example.com').then((res) => {
        assert.strictEqual(typeof res, 'string');
        done();
      }).catch(console.log.bind(console));
    });

    it('https', (done) => {
      let fetcher = new Fetcher(proxy);

      fetcher.fetch('https://example.com').then((res) => {
        assert.strictEqual(typeof res, 'string');
        done();
      }).catch(console.log.bind(console));
    });
  });
});
