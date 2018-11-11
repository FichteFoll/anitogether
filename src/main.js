import 'semantic-ui-css/semantic.min.css'

import Vue from 'vue'
import SuiVue from 'semantic-ui-vue'

Vue.use(SuiVue)

import App from './App.vue'

Vue.config.productionTip = false

export const vm = new Vue({
  render (h) { return h(App) },
}).$mount('#app')
// export const vm = new Vue({
//   el: '#app',
//   template: '<App/>',
//   components: { App },
// })
