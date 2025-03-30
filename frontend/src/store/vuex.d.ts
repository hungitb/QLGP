import { Store } from "vuex";
import Vue, { ComponentOptions } from "vue";
import store from ".";

declare module "vue/types/vue" {
  // provide typings for `this.$store`
  interface Vue {
    $store: typeof store;
  }
}
