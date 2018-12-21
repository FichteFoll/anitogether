/* eslint-env node */

module.exports = {
  baseUrl: process.env.CI === 'true'
    ? '/anitogether/'
    : '/',

  chainWebpack: (config) => {
    /* eslint indent: off */
    const normalRule = config.module.rule('css').oneOfs.store.get('normal')
    config.module.rule('css').oneOfs.store.delete('normal')
    config.module.rule('css')
      .oneOf('useable')
        .test(/\.useable\.css$/)
        .use('style-loader/useable')
          .loader('style-loader/useable')
          .options({ sourceMap: false,
                     shadowMode: false })
          .end()
        .use('css-loader')
          .loader('css-loader')
          .options({ sourceMap: false,
                     importLoaders: 2 })
          .end()
        .use('postcss-loader')
          .loader('postcss-loader')
          .options({ sourceMap: false })
          .end()
    config.module.rule('css').oneOfs.store.set('normal', normalRule)

    // console.log(config.module.rule('css').oneOfs)
  },
}
