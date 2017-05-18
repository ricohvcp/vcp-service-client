'use strict';

let gulp = require('gulp')
  , babel = require('gulp-babel')
  , browserify = require('browserify')
  , del = require('del')
  , eslint = require('gulp-eslint')
  , espower = require('gulp-espower')
  , istanbul = require('gulp-istanbul')
  , merge = require('merge-stream')
  , mocha = require('gulp-mocha')
  , rename = require('gulp-rename')
  , source = require('vinyl-source-stream')
  , uglify = require('gulp-uglify');


/**
 * |-- config
 * |   `-- config.js
 * |-- src
 * |   `-- *.js
 * |-- test
 * |   `-- *.js
 * |-- build (babeled)
 * |   |-- browser (browserifyed)
 * |   |   |-- bundle.js
 * |   |   |-- bundle.min.js
 * |   |   `-- bundle.test.js
 * |   |-- config
 * |   |   `-- config.js
 * |   |-- src
 * |   |   `-- *.js
 * |   `-- test
 * |       `-- *.js
 * `-- tmp (coverage etc)
 */
// eslint all javascripts including setting/config files
gulp.task('lint', () => {
  return gulp.src(['src/**/*.js', 'test/**/*.js', 'gulpfile.js', '*.conf.js'])
             .pipe(eslint())
             .pipe(eslint.format())
             .pipe(eslint.failOnError());
});

// compile all javascripts with babel
// and saved into build dir.
//
// config/* =>   build/config/*
// src/*    =>   build/src/*
// test/*   =>   build/test/*
gulp.task('build:babel', () => {
  let preset = {
    presets: ['es2015'],
  };

  // copy only config.js not config.template.js
  let config = gulp.src('config/config.js')
                   .pipe(babel(preset))
                   .pipe(gulp.dest('build/config/'));

  let src = gulp.src('src/**/*.js')
                .pipe(babel(preset))
                .pipe(gulp.dest('build/src/'));

  let test = gulp.src('test/**/*.js')
                 .pipe(babel(preset))
                 .pipe(espower()) // power-assert transpile
                 .pipe(gulp.dest('build/test/'));

  return merge(src, config, test);
});

// build with browserify
gulp.task('build:browserify', ['build:babel'], (done) => {
  browserify('./build/src/index.js', { standalone: 'VCPClient' })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./build/browser'))
    .on('end', done);
});

// build src for browser
gulp.task('build', ['build:browserify'], () => {
  gulp.src('build/browser/bundle.js')
      .pipe(uglify())
      .pipe(rename({
        extname: '.min.js',
      }))
      .pipe(gulp.dest('./build/browser'));
});

// run test on mocha and get coverage
gulp.task('test', ['build:babel'], (cb) => {
  gulp.src('build/src/**/*.js')
      .pipe(istanbul())
      .pipe(istanbul.hookRequire())
      .on('finish', () => {
        let option = {
          reporter: 'spec',
        };
        if (process.argv[4]) {
          // --env option comes here
          option.grep = process.argv[4];
        }
        gulp.src('build/test/*.js')
          .pipe(mocha(option))
          .pipe(istanbul.writeReports({
            dir:        'tmp',
            reporters:  ['html', 'text'],
            reportOpts: { dir: 'tmp' },
          }))
          .on('end', cb)
          .on('error', cb);
      });
});

// clean temporally files
gulp.task('clean', (cb) => {
  return del(['build/*', 'tmp/*', 'npm-debug.log', '!*/.gitkeep'], cb);
});

// clean all dependencies and temporally files
gulp.task('clean:all', ['clean'], (cb) => {
  return del('node_modules', cb);
});
