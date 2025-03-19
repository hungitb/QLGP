import { Store } from "vuex";
import Vue, { ComponentOptions } from "vue";
import { getDefaultState } from ".";

declare module "vue/types/vue" {
  // provide typings for `this.$store`
  interface Vue {
    $store: Store<ReturnType<typeof getDefaultState>>;
  }
}
