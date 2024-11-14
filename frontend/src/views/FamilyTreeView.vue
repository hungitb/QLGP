<template>
  <div id="family-tree" class="d-flex justify-center align-center">
    <Viewer style="width: 600px; height: 600px; border: 1px solid">
      <v-img src="favicon.ico" height="1000" width="1000" />
    </Viewer>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import Viewer from "@/components/Viewer.vue";
import { personApi } from "@/api/person";

enum Layout {
  MIN_HEIGHT = "MIN_HEIGHT",
  MIN_WIDTH = "MIN_WIDTH",
}

export default Vue.extend({
  components: {
    Viewer,
  },
  data() {
    return {
      config: {
        show: {
          image: true,
          name: true,
          gender: true,
          birthday: true,
          status: true,
        },
        layout: Layout.MIN_HEIGHT,
        props: {
          horizontalDistance: 80,
          verticalDistance: 120,
          [Layout.MIN_HEIGHT]: {
            height: 180,
            width: 360,
          },
          [Layout.MIN_WIDTH]: {
            height: 600,
            width: 300,
          },
        },
      },
    };
  },
  mounted() {
    // to do
  },
});
</script>

<style lang="scss">
#family-tree {
  height: 100%;
}
</style>
