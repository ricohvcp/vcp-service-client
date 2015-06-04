var assert = require('power-assert');
var Validator = require('../src/validator').Validator;

describe('Validator test', function() {
  it('constructor', () => {
    let v = new Validator();
    assert(v.new);
    assert(v.logUpload);
  });
});
