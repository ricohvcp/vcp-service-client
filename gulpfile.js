/*eslint global-strict:0*/
'use strict';
var gulp = require('gulp'),
    bower = require('main-bower-files'),
    browserify = require('browserify'),
    connect = require('gulp-connect'),
    del = require('del'),
    espower = require('gulp-espower'),
    istanbul = require('gulp-istanbul'),
    mocha = require('gulp-mocha'),
    removeLines = require('gulp-remove-lines'),
    source = require('vinyl-source-stream'),
    babel = require('gulp-babel');


/**
 * .
 * /build - compiled
 * /lib   - main of bower components
 * /src   - javascripts
 * /test  - tests
 * /tmp   - temporally files (build, coverage, etc)
 */

// server starts at root with port 3000
gulp.task('server', function() {
  return connect.server({
    port: 3000,
    livereload: true
  });
});

// eslint all javascripts
gulp.task('lint', function() {
  // TODO: gulp-eslint doesn't support latest eslint
  // please update this task when updated.
});

// all bower componets are copy in /lib
gulp.task('bower', function() {
  return gulp.src(bower({ includeDev: 'inclusive' }))
    .pipe(gulp.dest('lib'));
});

// build with babel
gulp.task('build:babel', function() {
  return gulp.src('src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('build/src'));
});

// build with browserify
gulp.task('build:browserify', [ 'build:babel', 'build:test' ], function() {
  /*eslint comma-spacing: 0*/
  gulp.src('build/src/index.js')
    // remove require() before browserify
    // for avoid bundiling npm module
    .pipe(removeLines({ 'filters': [
      /require\(['"]xmlhttprequest/
    ]}))
    .pipe(removeLines({ 'filters': [
      /require\(['"]urlsearchparams/
    ]}))
    .pipe(gulp.dest('build/src'))
    .on('end', function() {
      browserify('./build/src/index.js')
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./build/browser'));

      browserify('./build/test/test.js')
        .ignore('power-assert')
        .bundle()
        .pipe(source('bundle.test.js'))
        .pipe(gulp.dest('./build/browser'));
    });
});

// build src for browser
gulp.task('build', ['build:browserify']);

// all test are in /test, convert to power-assert in /tmp
gulp.task('build:test', function() {
  return gulp.src('test/*.js')
    .pipe(babel())
    .pipe(espower())
    .pipe(gulp.dest('build/test'));
});

// run test on mocha and get coverage
gulp.task('test', [ 'build:babel', 'build:test' ], function(cb) {
  gulp.src('build/src/**/*.js')
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function() {
      gulp.src('build/test/*.js')
        .pipe(mocha({
          // grep: 'auth',
          reporter: 'spec'
        }))
        .pipe(istanbul.writeReports({
          dir: 'tmp',
          reporters: [ 'html', 'text' ],
          reportOpts: { dir: 'tmp' }
        }))
        .on('end', cb);
    });
});

// clean temporally files
gulp.task('clean', function(cb) {
  return del([ 'build/*', 'lib/*', 'tmp/*', 'npm-debug.log', '!*/.gitkeep' ], cb);
});

// clean all dependencies and temporally files
gulp.task('clean:all', ['clean'], function(cb) {
  return del([ 'node_modules', 'bower_components' ], cb);
});
