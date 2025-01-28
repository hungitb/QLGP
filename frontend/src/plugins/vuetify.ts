import Vue from "vue";
import Vuetify from "vuetify/lib/framework";

import vi from "vuetify/src/locale/vi";

import BootstrapDiagram3Fill from "./BootstrapDiagram3Fill.vue";

Vue.use(Vuetify);

export default new Vuetify({
  lang: {
    locales: { vi },
    current: "vi",
  },
  icons: {
    values: {
      "bootstrap-diagram-3-fill": {
        component: BootstrapDiagram3Fill,
      },
    },
  },
});
