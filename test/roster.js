var assert = require('power-assert');
var VCPClient = require('../src').VCPClient;
var FetchError = require('../src/fetcher').FetchError;
var config = require('../config/config').config;
var endpoint = config.ENDPOINT;

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

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
        return client.getRoster();
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
        return client.getRoster();
      }).then((rosters) => {
        if (rosters.results.length > 0) {
          cid = rosters.results.shift().udc_id;
        } else {
          return done(new Error(`${params.username} doesn't have a roster`));
        }
        return client.getRoster(cid);
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
        return client.getRoster('invalidCID');
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

  describe('addRoster', () => {
    it('with only udc_id', () => {
      let cid = '999001010059';

      let client = new VCPClient(endpoint, params);
      client.auth().then(() => {
        return client.addRoster(cid);
      }).then((result) => {
        assert.strictEqual(result.udc_id, cid);
        assert.strictEqual(result.ask, 'subscribe');
        assert.strictEqual(result.subscription, 'none');
        console.log(result);
      });
    });

    it('with name, name_kana', () => {
      let cid = '999001010059';
      let options = {
        name: '59',
        name_kana: 'ごじゅうきゅう',
        sender_name: '50',
        sender_name_kana: 'ごじゅう'
      };

      let client = new VCPClient(endpoint, params);
      client.auth().then(() => {
        return client.addRoster(cid, options);
      }).then((result) => {
        assert.strictEqual(result.udc_id, cid);
        assert.strictEqual(result.ask, 'subscribe');
        assert.strictEqual(result.subscription, 'none');
        assert.strictEqual(result.name, options.name);
        assert.strictEqual(result.name_kana, options.name_kana);
      });
    });
  });

  describe('updateRoster', () => {
    it('subscribe', () => {
      let p = clone(params);

      p.username = '999001010059';
      p.password = '999001010059';

      let cid = '999001010050';
      let options = {
        type: 'subscribed'
      };

      let client = new VCPClient(endpoint, p);
      client.auth().then(() => {
        return client.updateRoster(cid, options);
      }).then((result) => {
        assert.strictEqual(result.udc_id, cid);
        assert.strictEqual(result.subscription, 'both');
        assert.strictEqual(result.ask, '');
      });
    });

    it('unsubscribe', () => {
      let p = clone(params);

      p.username = '999001010059';
      p.password = '999001010059';

      let cid = '999001010050';
      let options = {
        type: 'unsubscribed'
      };

      let client = new VCPClient(endpoint, p);
      client.auth().then(() => {
        return client.updateRoster(cid, options);
      }).then((result) => {
        assert.strictEqual(result, null);
      });
    });
  });

  describe('deleteRoster', () => {
    let cid = '999001010059';

    let client = new VCPClient(endpoint, params);
    client.auth().then(() => {
      return client.deleteRoster(cid);
    }).then((result) => {
      assert.strictEqual(result, null);
    });
  });
});
