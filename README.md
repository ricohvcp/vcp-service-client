# vcp-service-client

[![npm version](https://badge.fury.io/js/vcp-service-client.svg)](http://badge.fury.io/js/vcp-service-client)
[![Dependency Status](https://gemnasium.com/ricohvcp/vcp-service-client.svg)](https://gemnasium.com/ricohvcp/vcp-service-client)


## DESCRIPTION

RICOH Visual Communication Platform service client for javascript


## install

```sh
$ npm install vcp-service-client
```

or you can use built(and minified) version of JS for browser in [releases](https://github.com/ricohvcp/vcp-service-client/releases/).

## API

### configuration params

```js
var params = {
  client_id:     'your client id',
  client_secret: 'your client secret',
  username:      'your cid',
  password:      'your password',
  scope:         ['list', 'of', 'granted', 'scope'], // see list on src/scopes.js
  grant_type:    'password' // fixed value
};
```

### create instance

create instance with Auth URI Endpoint and configuration params.

```js
// create instance
var client = new VCPClient('https://auth.ucs.ricoh.com', params);
```

### auth()

call auth API and save authentication result in instance. return Promise.
need to call this onece, before calling other api.

```js
// login
client.auth()
      .then(function() {
        // result will saved into instance
        // but usually no need to access directory.
        console.log(client.authInfo);
      });
```

### accountInfo()

call account info API and return Promise.

```js
client.accountInfo()
      .then(function(accountInfo) {
        console.log(accountInfo);
      });
```

### userInfo()

call user info API and return Promise.

```js
client.userInfo()
      .then(function(userInfo) {
        console.log(userInfo);
      });
```

### information()

call infomation API and return Promise.

```js
client.information()
      .then(function(information) {
        console.log(information);
      });
```

### getRoster()

call roster API and get all roster info and return Promise.

```js
client.getRoster()
      .then(function(rosters) {
        console.log(rosters);
      });
```

call roster API with cid, get roster info of given cid and return Promise.

```js
var cid = 'xxxxxx';
client.getRoster(cid)
      .then(function(roster) {
        console.log(roster);
      });
```

### addRoster()

call roster API and send roster request and return Promise.

```js
var cid = 'xxxxxx';
var options = {
  name: 'A',
  name_kana: 'えー',
  sender_name: 'B',
  sender_name_kana: 'びー'
};

client.addRoster(cid, options)
      .then((result) => {
        console.log(result);
      }).catch();
```

### updateRoster()

call roster API and send update request and return Promise.

```js
var cid = 'xxxxxx';
var options = {
  type: 'subscribed', // or 'unsubscribed'
  name: 'A',
  name_kana: 'えー'
};

client.updateRoster(cid, options)
      .then(function(result) {
        console.log(result);
      });
```

### deleteRoster()

call roster API and send delete request and return Promise.

```js
var cid = 'xxxxxx';

client.deleteRoster(cid)
      .then(function(result) {
        console.log(result);
      });
```

### logUpload()

call logupload API and upload logdata, return Promsie

```js
var log = 'this is log data which you wanna upload';
var filename = 'mylogfilename'; // this will be name of saved file at log server
var timeout = 5000; // (default 10000 ms)


client.logUpload(log, filename, timeout)
      .then(function() {
        console.log('upload finished');
      })
```

### discovery()

call a discovery API with directory specified `SCOPE` value, and return Promise.


```js
var scope = require('src/scopes').SCOPES;

// this is really equivalant to client.infomation()
client.discovery(scope.INFORMATION_URI)
      .then(function(result) {
        console.log(result);
      });


// multiple scope
client.discovery([scopes.USERINFO_QUERY, scopes.INFORMATION_URI])
      .then(function(result) {
        console.log(result);
      });
```

### Example

call auth & user info api.


in browser

```html
<script src="build/browser/bundle.min.js"></script>
<script>
var client = new VCPClient('https://auth.ucs.ricoh.com', config);

// call this first
client.auth().then(function() {
  console.log('auth success');
});

document.getElementById('#userinfo')
        .addEventListener('click', function() {
          // call after auth
          client.userInfo().then(function(info) {
            cosnole.log(info);
          });
        });
</script>
```

in server

```js
var VCPClient = require('build/src').VCPClient;

var client = new VCPClient('https://auth.ucs.ricoh.com', config);

client.auth().then(function() {
  return client.userInfo();
}).then(function(info) {
  console.log(info);
});
```

## Proxy support

request via proxy in node.js need to add [vcp-service-client-proxy](https://github.com/ricohvcp/vcp-service-client-proxy)

```js
var Proxy = require('vcp-service-client-proxy');
var VCPClient = require('vcp-service-client').VCPClient;

var proxy = Proxy({ http: 'http://proxy.com', https: 'https://proxy.com' });
//  proxy = Proxy(); default arguments is process.env.HTTP(s)_PROXY

var params = {
  client_id: client_id,
  client_secret: client_secret,
  ...
  proxy: proxy // add proxy
};

var client = new VCPClient(endpoint, params);
client.auth().then(function() {
  ...
});
```

in browser usage, set correct value to browser not modify code.


## Canceling requests

all promise from request API are cancelable.

for example, you can cancel logupload with calling `cancel()` method.


```js
var log = 'this is log data which you wanna upload';
var filename = 'mylogfilename'; // this will be name of saved file at log server
var timeout = 5000; // (default 10000 ms)

var uploadPromise = client.logUpload(log, filename, timeout)
      .then(function() {
        console.log('upload finished');
      })
      .catch(function() {
        console.error('upload timeouted, aborted, or failed');
      })
      .finally(function() {
        if (uploadPromise.isCancelled()) {
          console.log('cancelled');
        }
      });

document.getElementById('uploadcancel')
      .addEventListener('click', function() {
        uploadPromise.cancel();
      });
```

## how to build yourself

```sh
$ git clone https://github.com/ricohvcp/vcp-service-client
$ npm install
$ npm run build
```

- source for node.js will be in `build/src` directory
- source for browser will be in `build/browser` directory


## test

fill the [config/config.template.js](https://github.com/ricohvcp/vcp-service-client/blob/master/config/config.template.js) with your value. and rename it to `config/config.js`

and then run test task

```
$ npm test
```

or you can run test on browser via karma from this task.

```
$ npm run test-browser
```

change target browser from `karma.conf.js`


## tasks

all tasks could run from npm command.

```sh
## install npm dependencies
$ npm install

## build all files in build/
$ npm run build

## clean the build, tmp, lib, and npm-debug.log
$ npm run clean

## remove all build and dependencies
$ npm run clean-all

## check js style and config files
$ npm run lint

## run test on server
$ npm test

## run test on browser and get coverage
$ npm run test-browser
```


## LICENSE

MIT
