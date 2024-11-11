import Vue from "vue";
import Vuetify from "vuetify/lib/framework";
import "bootstrap-icons/font/bootstrap-icons.css";

import vi from "vuetify/src/locale/vi";

Vue.use(Vuetify);

export default new Vuetify({
  lang: {
    locales: { vi },
    current: "vi",
  },
});
