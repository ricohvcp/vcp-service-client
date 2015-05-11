var assert = require('power-assert');
var Fetcher = require('../src').Fetcher;

var proxy_wrapper = require('superagent-proxy');

var http_proxy = process.env.HTTP_PROXY;
var https_proxy = process.env.HTTPS_PROXY;

describe('Fetcher test', function() {
  /*eslint no-inner-declarations:0, no-redeclare:0*/

  this.timeout(10 * 1000); // 10sec

  describe('proxy', () => {
    it('http', (done) => {
      let fetcher = new Fetcher();

      let proxy = { wrapper: proxy_wrapper, url: http_proxy };
      fetcher.fetch('http://example.com', { proxy: proxy }).then((res) => {
        assert.strictEqual(typeof res, 'string');
        done();
      }).catch(console.log.bind(console));
    });

    it('https', (done) => {
      let fetcher = new Fetcher();

      let proxy = { wrapper: proxy_wrapper, url: https_proxy };
      fetcher.fetch('https://example.com:443', { proxy: proxy }).then((res) => {
        assert.strictEqual(typeof res, 'string');
        done();
      }).catch(console.log.bind(console));
    });
  });
});
