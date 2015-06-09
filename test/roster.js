var assert = require('power-assert');
var VCPClient = require('../src').VCPClient;
var FetchError = require('../src/fetcher').FetchError;
var config = require('../config/config').config;
var endpoint = config.ENDPOINT;

describe('roster test', function() {
  let params = {
    client_id: config.CLIENT_ID,
    client_secret: config.CLIENT_SECRET,
    username: config.CID,
    password: config.PASSWORD,
    scope: config.SCOPE_LIST,
    grant_type: 'password'
  };

  describe('rosters', () => {
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

  describe('roster', () => {
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
});
