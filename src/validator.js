var Violate = require('violations').Violate;

export class Validator {
  constructor() {
    this.new = this.buildNew();
    this.logUpload = this.buildLogUpload();
  }

  buildNew() {
    let paramRule = {
      'client_id': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `params.${name} is required`;
        }

        if (!_.isString(val)) {
          return `params.${name} should be string`;
        }
      },

      'client_secret': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `params.${name} is required`;
        }

        if (!_.isString(val)) {
          return `params.${name} should be string`;
        }
      },

      'username': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `params.${name} is required`;
        }

        if (!_.isString(val)) {
          return `params.${name} should be string`;
        }
      },

      'password': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `params.${name} is required`;
        }

        if (!_.isString(val)) {
          return `params.${name} should be string`;
        }
      },

      'scope': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `params.${name} is required`;
        }

        if (!_.isArray(val)) {
          return `params.${name} should be array`;
        }
      },

      'grant_type': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `params.${name} is required`;
        }

        if (!_.isString(val)) {
          return `params.${name} should be string`;
        }
      },

      'proxy': (val, name, _) => {
        if (_.isEmpty(val)) {
          return; // optional
        }

        if (!_.isFunction(val)) {
          return `params.${name} should be function`;
        }
      }
    };

    let rules = {
      'endpoint': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `${name} is required`;
        }

        if (!_.isString(val)) {
          return `${name} should be string`;
        }
      },

      'params': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `${name} is required`;
        }

        if (!_.isObject(val)) {
          return `${name} should be object`;
        }

        let paramValidate = new Violate(paramRule);
        return paramValidate.validate(val);
      }
    };

    return new Violate(rules);
  }

  buildLogUpload() {
    let rules = {
      'log': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `${name} is required`;
        }

        if (val.length >= 1024 * 1024 * 128) {
          return 'logfile too big. (API limit 128MB)';
        }
      },
      'filename': (val, name, _) => {
        if (_.isEmpty(val)) {
          return `${name} is required`;
        }

        let messages = [];
        if (val.length > 32) {
          // API limit for logfile name
          messages.push('logfile name too large. (API limit less than 32byte )');
        }

        if (!/^[a-zA-Z0-9_\-\.]+$/.test(val)) {
          // API limit is limit for logfile size
          messages.push('invalid log filename. (API limit alphanumeric and -, ., _)');
        }

        return messages;
      },
      'timeout': (val, name, _) => {
        if (_.isEmpty(val)) {
          return; // optional
        }

        if (!_.isNumber(val)) {
          return `${name} should be Number`;
        }
      }
    };

    return new Violate(rules);
  }
}
