import Vue from "vue";
import Router from "vue-router";
import _import from "./_import";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      name: "home",
      redirect: "/local1",
    },
    {
      path: "/local1",
      name: "local1",
      component: _import("webrtc/local1"),
    },
  ],
});
