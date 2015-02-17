var assert = require('power-assert');
var Session = require('../src').Session;
var FetchError = require('../src').FetchError;
var config = require('../src/config').config;
var endpoint = config.ENDPOINT;

describe('Session test', function() {
  /*eslint no-inner-declarations:0*/

  this.timeout(5000);

  let params = {
    client_id: config.CLIENT_ID,
    client_secret: config.CLIENT_SECRET,
    username: config.CID_RWAN,
    password: config.PASSWORD_RWAN,
    scope: config.SCOPE_LIST,
    grant_type: 'password'
  };

  it('constructor', () => {
    let session = new Session(params, endpoint);
    assert.ok(session.params);
    assert.strictEqual(Object.keys(session.events).length, 0);
  });

  it('on', () => {
    let session = new Session(params, endpoint);
    function test0() {}
    function test1() {}
    function test2() {}

    session.on('test', test0);
    session.on('test', test1);
    session.on('test', test2);
    assert.strictEqual(session.events.test.length, 3);
    assert.strictEqual(session.events.test[0], test0);
    assert.strictEqual(session.events.test[1], test1);
    assert.strictEqual(session.events.test[2], test2);
  });

  it('off', () => {
    let session = new Session(params, endpoint);

    function test0() {}
    function test1() {}
    function test2() {}

    session.on('test0', test0);
    session.on('test1', test1);
    session.on('test2', test2);

    session.off();
    assert.strictEqual(Object.keys(session.events).length, 0);
  });

  it('off name', () => {
    let session = new Session(params, endpoint);

    function test0() {}
    function test1() {}
    function test2() {}

    session.on('test', test0);
    session.on('test', test1);
    session.on('test', test2);

    session.off('test', test1);
    assert.strictEqual(session.events.test.length, 2);
    assert.strictEqual(session.events.test[0], test0);
    assert.strictEqual(session.events.test.indexOf(test1), -1);
    assert.strictEqual(session.events.test[1], test2);
  });

  it('off name all', () => {
    let session = new Session(params, endpoint);

    function test0() {}
    function test1() {}
    function test2() {}

    session.on('test', test0);
    session.on('test', test1);
    session.on('test', test2);

    session.off('test');
    assert.strictEqual(session.events.test, undefined);
  });

  it('emit', () => {
    let session = new Session(params, endpoint);

    let c = 0;
    session.on('test', function test0(data) {
      assert.strictEqual(data, 'data');
      if (c++ === 2) {
        done();
      }
    });

    session.on('test', function test1(data) {
      assert.strictEqual(data, 'data');
      if (c++ === 2) {
        done();
      }
    });

    session.emit('test', 'data');
  });

  it('auth', (done) => {
    let session = new Session(params, endpoint);
    session.auth().then(() => {
      assert.ok(session.authInfo.access_token);
      assert.ok(session.authInfo.refresh_token);
      assert.ok(session.authInfo.token_type);
      assert.ok(session.authInfo.expires_in);
      assert.ok(session.authInfo.scope);
      done();
    }).catch(done);
  });

  it('accountInfo', (done) => {
    let session = new Session(params, endpoint);
    session.auth().then(() => {
      return session.accountInfo();
    }).then((info) => {
      assert.strictEqual(typeof info.email_verified, 'boolean');
      assert.strictEqual(typeof info.web_password_changed, 'boolean');
      done();
    }).catch(done);
  });

  it('userInfo', (done) => {
    let session = new Session(params, endpoint);
    session.auth().then(() => {
      return session.userInfo();
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

  it('information', (done) => {
    let session = new Session(params, endpoint);
    session.auth().then(() => {
      return session.information();
    }).then((info) => {
      assert.strictEqual(typeof info.ja, 'string');
      assert.strictEqual(typeof info.global, 'string');
      done();
    }).catch(done);
  });

  it('udcservice', (done) => {
    let session = new Session(params, endpoint);
    session.auth().then(() => {
      return session.udcService();
    }).then((service) => {
      // TODO: more assert
      assert.ok(service);
      done();
    }).catch(done);
  });

  it('rosters', (done) => {
    let session = new Session(params, endpoint);
    session.auth().then(() => {
      return session.rosters();
    }).then((rosters) => {
      // TODO: more assert
      assert.ok(rosters);
      done();
    }).catch(done);
  });

  it('roster', (done) => {
    var cid;
    let session = new Session(params, endpoint);
    session.auth().then(() => {
      return session.rosters();
    }).then((rosters) => {
      if (rosters.results.length > 0) {
        cid = rosters.results.shift().udc_id;
      } else {
        return done(new Error(`${params.username} doesn't have a roster`));
      }
      return session.roster(cid);
    }).then((roster) => {
      assert.ok(roster);
      assert.strictEqual(roster.udc_id, cid);
      done();
    }).catch(done);
  });

  it('roster error', (done) => {
    var cid;
    let session = new Session(params, endpoint);
    session.auth().then(() => {
      return session.roster('invalidCID');
    }).then((roster) => {
      assert.ok(roster);
      assert.strictEqual(roster.udc_id, cid);
      done();
    }).catch((err) => {
      assert.ok(err instanceof FetchError);
      assert.strictEqual(err.message, '存在しないUDC-IDです');
      assert.strictEqual(err.code, 'roster.error.udcid.notexist');
      done();
    }).catch(done);
  });

  // TODO: fix service for browser
  //it('logUpload', (done) => {
  //  let session = new Session(params, endpoint);
  //  let filename = 'test_from_browser';
  //  let log = new Array(16).join('a').toString();

  //  session.auth().then(() => {
  //    return session.logUpload(log, filename);
  //  }).then((result) => {
  //    assert.strictEqual(result, '');
  //    done();
  //  }).catch(done);
  //});

  //it('logUpload cancel', (done) => {
  //  let session = new Session(params, endpoint);
  //  let filename = 'test_from_browser';
  //  let log = new Array(100000).join('a').toString();

  //  session.auth().then(() => {
  //    // cancel
  //    setTimeout(() => {
  //      session.logUploadCancel();
  //    }, 300);

  //    return session.logUpload(log, filename);
  //  }).then((result) => {
  //    assert.fail('cant be here');
  //  }).catch((err) => {
  //    assert.ok(err instanceof Error);
  //    assert.strictEqual(err.message, 'upload canceled');
  //    done();
  //  }).catch(done);
  //});

  it('logUpload file size error', () => {
    let session = new Session(params, endpoint);
    let filename = 'test_from_browser';
    let log = new Array(1024 * 1024 * 200).join('a').toString();

    try {
      session.logUpload(log, filename);
    } catch(err) {
      assert.strictEqual(err.message, 'logfile too big. (API limit 128MB)');
    }
  });

  it('logUpload file name error', () => {
    let session = new Session(params, endpoint);
    let filename = 'test#from%browser';
    let log = new Array(16).join('a').toString();

    try {
      session.logUpload(log, filename);
    } catch(err) {
      assert.strictEqual(err.message, 'invalid log filename. (API limit less than 32byte with alpahnumeric and -, ., _)');
    }
  });
});
