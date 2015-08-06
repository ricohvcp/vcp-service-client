const assert = require('power-assert');
const VCPClient = require('../src').VCPClient;
const FetchError = require('../src/fetcher').FetchError;
const config = require('../config/config').config;
const Promise = require('bluebird');
const endpoint = config.ENDPOINT;

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function nop() {}

describe('getRoster', function() {
  this.timeout(10 * 2000); // 20sec

  const params = {
    client_id: config.CLIENT_ID,
    client_secret: config.CLIENT_SECRET,
    username: config.CID,
    password: config.PASSWORD,
    scope: config.SCOPE_LIST,
    grant_type: 'password',
  };

  const client = new VCPClient(endpoint, params);

  describe('rosters', () => {
    it('success', (done) => {
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
      client.auth().then(() => {
        return client.getRoster('invalidCID');
      }).then((roster) => {
        assert.ok(roster);
        assert.strictEqual(roster.udc_id, cid);
        done();
      }).catch((err) => {
        assert.strictEqual(err.length, 1);
        const fetchErr = err[0];
        assert.ok(fetchErr instanceof FetchError);
        assert.strictEqual(fetchErr.message, '存在しないUDC-IDです');
        assert.strictEqual(fetchErr.code, 'roster.error.udcid.notexist');
        done();
      }).catch(done);
    });
  });
});

describe('story', function() {
  this.timeout(10 * 2000); // 20sec

  const params = {
    client_id: config.CLIENT_ID,
    client_secret: config.CLIENT_SECRET,
    scope: config.SCOPE_LIST,
    grant_type: 'password',
  };

  const A = '999001010058';
  const B = '999001010059';

  const paramA = clone(params);
  paramA.username = A;
  paramA.password = A;

  const paramB = clone(params);
  paramB.username = B;
  paramB.password = B;

  const clientA = new VCPClient(endpoint, paramA);
  const clientB = new VCPClient(endpoint, paramB);


  before((done) => {
    Promise.all([clientA.auth(), clientB.auth()]).then(nop).then(done, done);
  });

  it('A send request to B', (done) => {
    const options = {
      name: 'B',
      name_kana: 'びー',
      sender_name: 'A',
      sender_name_kana: 'えー',
    };

    clientA.addRoster(B, options).then((result) => {
      assert.strictEqual(result.udc_id, B);
      assert.strictEqual(result.ask, 'subscribe');
      assert.strictEqual(result.subscription, 'none');
      assert.strictEqual(result.name, options.name);
      assert.strictEqual(result.name_kana, options.name_kana);
      done();
    }).catch(done);
  });

  it('getRoster of both', (done) => {
    Promise.all([clientA.getRoster(), clientB.getRoster()]).then(([a, b]) => {
      assert.strictEqual(a.total_results, 1);
      assert.strictEqual(b.total_results, 1);

      const resultA = a.results[0];
      const resultB = b.results[0];

      assert.strictEqual(resultA.udc_id, B);
      assert.strictEqual(resultA.ask, 'subscribe');
      assert.strictEqual(resultA.subscription, 'none');

      assert.strictEqual(resultB.udc_id, A);
      assert.strictEqual(resultB.ask, '');
      assert.strictEqual(resultB.subscription, 'none');

      done();
    }).catch(done);
  });

  it('B accepts A', (done) => {
    const options = {
      type: 'subscribed',
    };

    clientB.updateRoster(A, options).then((result) => {
      assert.strictEqual(result.udc_id, A);
      assert.strictEqual(result.subscription, 'both');
      assert.strictEqual(result.ask, '');
      done();
    }).catch(done);
  });

  it('getRoster of both', (done) => {
    Promise.all([clientA.getRoster(), clientB.getRoster()]).then(([a, b]) => {
      assert.strictEqual(a.total_results, 1);
      assert.strictEqual(b.total_results, 1);

      const resultA = a.results[0];
      const resultB = b.results[0];

      assert.strictEqual(resultA.udc_id, B);
      assert.strictEqual(resultA.ask, '');
      assert.strictEqual(resultA.subscription, 'both');

      assert.strictEqual(resultB.udc_id, A);
      assert.strictEqual(resultB.ask, '');
      assert.strictEqual(resultB.subscription, 'both');

      done();
    }).catch(done);
  });

  it('B removes A', (done) => {
    clientB.deconsteRoster(A).then((result) => {
      assert.strictEqual(result, null);
      done();
    }).catch(done);
  });

  it('getRoster of both after', (done) => {
    Promise.all([clientA.getRoster(), clientB.getRoster()]).then(([a, b]) => {
      assert.strictEqual(a.total_results, 0);
      assert.strictEqual(b.total_results, 0);
      done();
    }).catch(done);
  });
});
