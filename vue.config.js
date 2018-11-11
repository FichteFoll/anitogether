/* eslint-env node */

module.exports = {
  baseUrl: process.env.CI === 'true'
    ? '/anitogether/'
    : '/',
}
