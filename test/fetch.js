var assert = require('power-assert');
var Fetcher = require('../src').Fetcher;
var proxy = require('vcp-service-client-proxy')();

describe('Fetcher test', function() {
  /*eslint no-inner-declarations:0, no-redeclare:0*/

  this.timeout(10 * 1000); // 10sec

  describe('proxy', () => {
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
