<template>
  <div id="family-tree">
    <Viewer style="width: 100%; height: 100%">
      <div
        style="
          height: 2000px;
          width: 2000px;
          background-image: linear-gradient(to right, red, yellow);
        "
      ></div>
    </Viewer>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import Viewer from "@/components/Viewer.vue";

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
});
</script>

<style lang="scss">
#family-tree {
  height: 100%;
}
</style>
