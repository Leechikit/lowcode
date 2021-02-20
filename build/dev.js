const merge = require('webpack-merge')
const baseConfig = require('./base')

module.exports = merge(baseConfig, {
  devServer: {
    proxy: {
      '/': {
        target: 'http://10.50.208.213:9009/',
        changeOrigin: true
      }
    }
  },
  configureWebpack: {
    output: {
      globalObject: 'this' // `typeof self !== 'undefined' ? self : this`'' -- not working
    }
  },
  chainWebpack: config => config.resolve.symlinks(false)
})
