const gulp = require('gulp');
const del = require('del');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const rollup = require('rollup').rollup;
const rollupBabel = require('rollup-plugin-babel');

const babelConfig = {
  presets: [
    ['@babel/preset-env', {
      loose: true,
      modules: false
    }]
  ],
  plugins: [
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-export-namespace-from'
  ]
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
      plugins: ['@babel/plugin-transform-modules-commonjs'],
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

const minify = () =>
  gulp.src('./lib/browser.js')
    .pipe(uglify())
    .pipe(rename('plug-modules.js'))
    .pipe(gulp.dest('./'));
gulp.task('rollup:min', gulp.series('rollup', minify));

gulp.task('default', gulp.parallel('build', 'rollup:min'));
