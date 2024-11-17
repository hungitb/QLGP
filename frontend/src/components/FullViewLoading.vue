<template>
  <div class="d-flex align-center justify-center" :style="coatingStyle">
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  props: {
    tbb: {
      type: Boolean,
      default: false,
    },
    floating: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    coatingStyle() {
      if (this.floating) {
        return {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          backgroundColor: this.tbb ? "rgba(0, 0, 0, 0.4)" : "white",
        };
      }
      return {
        height: "100%",
        width: "100%",
      };
    },
  },
});
</script>
