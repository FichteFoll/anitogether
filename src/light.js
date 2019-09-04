import Vue from 'vue'
import SuiVue from 'semantic-ui-vue'

Vue.use(SuiVue)

import App from './App.vue'

Vue.config.productionTip = false

import './css/light.scss'

export const vm = new Vue({
  render (h) { return h(App) },
}).$mount('#app')
