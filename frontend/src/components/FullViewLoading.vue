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
  },
  computed: {
    coatingStyle() {
      return {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        ...(this.tbb ? { backgroundColor: "rgba(0, 0, 0, 0.4)" } : {}),
      };
    },
  },
});
</script>
