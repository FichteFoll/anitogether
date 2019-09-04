/* eslint-env node */

module.exports = {
  publicPath: process.env.CI === 'true'
    ? '/anitogether/'
    : '/',

  pages: {
    index: {
      entry: 'src/main.js',
      template: 'public/index.html',
      filename: 'index.html',
    },
    light: {
      entry: 'src/light.js',
      template: 'public/index.html',
      filename: 'light.html',
    },
  },
}
