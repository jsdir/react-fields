var webpackConfig = require('./webpack.config.js');

module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],
    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'test/**/*_test.js'
    ],
    preprocessors: {
      'test/**/*_test.js': ['webpack', 'sourcemap']
    },
    browsers: ['jsdom'],
    reporters: ['progress'],
    webpack: webpackConfig,
    webpackMiddleware: {
      noInfo: true,
      quiet: true
    }
  });
};
