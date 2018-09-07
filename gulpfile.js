const gulp = require('gulp');
const del = require('del');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const rollup = require('rollup').rollup;
const rollupBabel = require('rollup-plugin-babel');
const generateMatchFiles = require('./tools/extract-matchers-files');

const babelConfig = {
  presets: [
    ['env', { loose: true, modules: false }],
  ],
  plugins: [
    'transform-export-extensions',
  ],
};

gulp.task('clean', () => del([
  './es',
  './lib'
]));

gulp.task('build', () =>
  gulp.src('./src/**/*.js')
    .pipe(babel(babelConfig))
    .pipe(gulp.dest('./es'))
    .pipe(babel({
      plugins: ['transform-es2015-modules-commonjs'],
    }))
    .pipe(gulp.dest('./lib'))
);

gulp.task('rollup', () =>
  rollup({
    input: './src/index.js',
    plugins: [
      rollupBabel(babelConfig),
    ],
  }).then(bundle => bundle.write({
    file: './lib/browser.js',
    format: 'umd',
    name: 'plug-modules',
    globals: {
      underscore: '_',
    },
  }))
);

gulp.task('rollup:min', ['rollup'], () =>
  gulp.src('./lib/browser.js')
    .pipe(uglify())
    .pipe(rename('plug-modules.js'))
    .pipe(gulp.dest('./'))
);

gulp.task('default', ['build', 'rollup:min']);
