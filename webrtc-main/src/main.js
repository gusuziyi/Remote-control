import Vue from "vue";
import App from "./App.vue";
import router from "./router/router";
import socket from "./utils/socket";
import "element-ui/lib/theme-chalk/index.css";

socket.on("connect", () => {
  console.log("连接成功");
});
socket.on("disconnect", () => {
  console.log("连接断开了");
});
Vue.config.productionTip = false;
Vue.prototype.$bus = new Vue();
new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
