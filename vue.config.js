/* eslint-env node */

module.exports = {
  publicPath: process.env.CI === 'true'
    ? '/anitogether/'
    : '/',
}
