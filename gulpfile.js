/*eslint global-strict:0*/
'use strict';
var gulp = require('gulp'),
    babel = require('gulp-babel'),
    bower = require('main-bower-files'),
    browserify = require('browserify'),
    del = require('del'),
    eslint = require('gulp-eslint'),
    espower = require('gulp-espower'),
    istanbul = require('gulp-istanbul'),
    merge = require('merge-stream'),
    mocha = require('gulp-mocha'),
    rename = require('gulp-rename'),
    source = require('vinyl-source-stream'),
    uglify = require('gulp-uglify');


/**
 * |-- src
 * |   `-- *.js
 * |-- test
 * |   `-- *.js
 * |-- build (compiled)
 * |   |-- src
 * |   |   `-- *.js
 * |   `-- test
 * |       `-- *.js
 * |-- tmp (tmpbuild, coverage etc)
 * `-- lib (bower libs)
 */

// eslint all javascripts including setting/config files
gulp.task('lint', function() {
  return gulp.src([ 'src/**/*.js', 'test/**/*.js', 'gulpfile.js', '*.conf.js' ])
             .pipe(eslint())
             .pipe(eslint.format())
             .pipe(eslint.failOnError());
});

// copy all bower componets in /lib
gulp.task('bower', function() {
  return gulp.src(bower({ includeDev: 'inclusive' }))
             .pipe(gulp.dest('lib'));
});

// compile all javascripts with babel
// and saved into build dir.
//
// src/*    =>   build/src/*
// config/* =>   build/config/*
// test/*   =>   build/test/*
gulp.task('build:babel', function() {
  var src = gulp.src('src/**/*.js')
                .pipe(babel())
                .pipe(gulp.dest('build/src'));

  var config = gulp.src('config/*.js')
                   .pipe(babel())
                   .pipe(gulp.dest('build/config'));

  var test = gulp.src('test/*.js')
                 .pipe(babel())
                 .pipe(espower())
                 .pipe(gulp.dest('build/test'));

  return merge(src, config, test);
});

// build with browserify
gulp.task('build:browserify', ['build:babel'], function(done) {
  gulp.src('build/src/index.js')
      .pipe(gulp.dest('build/src'))
      .on('end', function() {
        browserify('./build/src/index.js', { standalone: 'VCPClient' })
          .bundle()
          .pipe(source('bundle.js'))
          .pipe(gulp.dest('./build/browser'))
          .on('end', done);

        browserify('./build/test/test.js')
          .ignore('power-assert')
          .bundle()
          .pipe(source('bundle.test.js'))
          .pipe(gulp.dest('./build/browser'));
      });
});

// build src for browser
gulp.task('build', ['build:browserify'], function() {
  gulp.src('build/browser/bundle.js')
      .pipe(uglify())
      .pipe(rename({
        extname: '.min.js'
      }))
      .pipe(gulp.dest('./build/browser'));
});

// run test on mocha and get coverage
gulp.task('test', ['build:babel'], function(cb) {
  gulp.src('build/src/**/*.js')
      .pipe(istanbul())
      .pipe(istanbul.hookRequire())
      .on('finish', function() {
        var option = {
          reporter: 'spec'
        };
        if (process.argv[4]) {
          // --env option comes here
          option.grep = process.argv[4];
        }
        gulp.src('build/test/*.js')
          .pipe(mocha(option))
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
