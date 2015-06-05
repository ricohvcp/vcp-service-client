var assert = require('power-assert');
var Validator = require('../src/validator').Validator;

describe('Validator test', function() {
  it('constructor', () => {
    let v = new Validator();
    assert(v.new);
    assert(v.logUpload);
  });


  describe('buildLogUpload', () => {
    let v = new Validator();

    it('log', () => {
      [
        {
          arg: {},
          msg: [ 'log is required', 'filename is required' ]
        },
        {
          arg: { log: '', filename: '' },
          msg: [ 'log is required', 'filename is required' ]
        },
        {
          arg: { log: (new Array(134217729)).join('a'), filename: (new Array(134217729)).join('a') },
          msg: [
            'logfile too large. (API limit 128MB)',
            'logfile name too large. (API limit less than 32byte)'
          ]
        },
        {
          arg: { log: 'a', filename: '+' },
          msg: [ 'invalid log filename. (API limit alphanumeric and -, ., _)' ]
        },
        {
          arg: { log: 'a', filename: 'あ' },
          msg: [ 'invalid log filename. (API limit alphanumeric and -, ., _)' ]
        },
        {
          arg: { log: 'a', filename: 'a', timeout: 'a' },
          msg: [ 'timeout should be Number' ]
        },
      ].forEach((param) => {
        let msg = v.logUpload.validate(param.arg);
        assert.deepEqual(msg, param.msg);
      });
    });
  });
});
