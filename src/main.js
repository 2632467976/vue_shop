import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './plugins/element.js'
import './assets/fonts/iconfont.css'
import axios from 'axios'
// 导入全局样式表
import './assets/css/global.css'

// 配置请求的根路径
axios.defaults.baseURL = 'http://127.0.0.1:8888/api/private/v1/'

// 请求拦截
axios.interceptors.request.use(config => {
  // 每次请求都带着 token
  config.headers.Authorization = window.sessionStorage.getItem('token')
  return config
})

Vue.config.productionTip = false
Vue.prototype.$http = axios // 挂载

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
