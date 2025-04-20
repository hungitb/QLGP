<template>
  <div class="d-flex align-center justify-center" :style="coatingStyle">
    <v-progress-circular
      v-if="noFloating"
      indeterminate
      color="primary"
    ></v-progress-circular>
    <div v-else>
      <v-img
        :src="require('@/assets/logo.png')"
        class="mb-8 mx-auto"
        width="260"
        eager
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    applyOpacity: {
      type: Boolean,
      default: false,
    },
    noFloating: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    coatingStyle() {
      if (this.noFloating) {
        return {
          height: "100%",
          width: "100%",
        };
      }
      return {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        backgroundColor: (this as any).applyOpacity
          ? "rgba(0, 0, 0, 0.4)"
          : "white",
      };
    },
  },
});
</script>
