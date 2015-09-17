/* eslint max-len:0, no-invalid-this: 0 */
const assert = require('power-assert');
const Validator = require('../src/validator').Validator;

describe('Validator test', function() {
  this.timeout(10 * 2000); // 20sec

  it('constructor', () => {
    const v = new Validator();
    assert(v.new);
    assert(v.logUpload);
  });

  describe('buildNew', () => {
    it('endpoint/params', () => {
      const v = new Validator();
      [
        {
          arg: {},
          msg: ['endpoint is required', 'params is required'],
        },
        {
          arg: { endpoint: null, params: null },
          msg: ['endpoint is required', 'params is required'],
        },
        {
          arg: { endpoint: {}, params: 'a' },
          msg: ['endpoint should be string', 'params should be object'],
        },
      ].forEach((param) => {
        const msg = v.new.validate(param.arg);
        assert.deepEqual(msg, param.msg);
      });
    });

    it('params', () => {
      const v = new Validator();
      [
        {
          arg: {},
          msg: ['client_id', 'client_secret', 'username', 'password', 'scope', 'grant_type'].map((m) => `params.${m} is required`),
        },
        {
          arg: { client_id: {}, client_secret: {}, username: {}, password: {}, grant_type: {}, scope: {}, proxy: {}},
          msg: ['client_id', 'client_secret', 'username', 'password', 'grant_type']
            .map((m) => `params.${m} should be string`)
            .concat(['params.scope should be array', 'params.proxy should be function']),
        },
      ].forEach((param) => {
        const msg = v.new.validate({ endpoint: 'a', params: param.arg });

        const act = msg.sort();
        const exp = param.msg.sort();
        assert.deepEqual(exp, act);
      });
    });
  });

  describe('buildAddContact', () => {
    it('buildAddContact', () => {
      const v = new Validator();
      const s101 = (new Array(102)).join('a');
      const s256 = (new Array(257)).join('a');
      [
        {
          arg: { name: {}, name_kana: {}, sender_name: {}, sender_name_kana: {}},
          msg: ['name', 'name_kana', 'sender_name', 'sender_name_kana'].map((m) => `${m} should be string`),
        },
        {
          arg: { name: s101, name_kana: 'a', sender_name: s101, sender_name_kana: 'a' },
          msg: ['name', 'sender_name'].map((m) => `${m}'s length should between 0 and 100`),
        },
        {
          arg: { name: 'a', name_kana: s256, sender_name: 'a', sender_name_kana: s256 },
          msg: ['name_kana', 'sender_name_kana'].map((m) => `${m}'s length should between 0 and 255`),
        },
      ].forEach((param) => {
        const msg = v.addContact.validate(param.arg);
        assert.deepEqual(msg, param.msg);
      });
    });
  });

  describe('buildLogUpload', () => {
    it('buildLogUpload', () => {
      const v = new Validator();
      [
        {
          arg: {},
          msg: ['log is required', 'filename is required'],
        },
        {
          arg: { log: '', filename: '' },
          msg: ['log is required', 'filename is required'],
        },
        {
          arg: { log: new Array(134217729), filename: (new Array(34)).join('a') },
          msg: [
            'logfile too large. (API limit 128MB)',
            'logfile name too large. (API limit less than 32byte)',
          ],
        },
        {
          arg: { log: 'a', filename: '+' },
          msg: ['invalid log filename. (API limit alphanumeric and -, ., _)'],
        },
        {
          arg: { log: 'a', filename: 'あ' },
          msg: ['invalid log filename. (API limit alphanumeric and -, ., _)'],
        },
        {
          arg: { log: 'a', filename: 'a', timeout: 'a' },
          msg: ['timeout should be Number'],
        },
      ].forEach((param) => {
        const msg = v.logUpload.validate(param.arg);
        assert.deepEqual(msg, param.msg);
      });
    });
  });
});
