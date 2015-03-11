# vcp-service-client

[![npm version](https://badge.fury.io/js/vcp-service-client.svg)](http://badge.fury.io/js/vcp-service-client)
[![Dependency Status](https://gemnasium.com/ricohvcp/vcp-service-client.svg)](https://gemnasium.com/ricohvcp/vcp-service-client)


## DESCRIPTION

RICOH Visual Communication Platform service client for javascript


## install

```sh
$ npm install vcp-service-client
```

if your target browser doesn't have `Promise` API.
use [ypromise](https://github.com/yahoo/ypromise) for polyfill.
after build task, `lib/promise.js` is that.


## how to build yourself

```sh
$ git clone https://github.com/ricohvcp/vcp-service-client
$ npm install
$ npm run build
```

- source for node.js will be in `build/src` directory
- source for browser will be in `build/browser` directory

## tasks

all tasks could run from npm command.

```sh
## install npm dependencies
$ npm install

## install bower dependencies and move it main files to lib
$ npm run bower

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
