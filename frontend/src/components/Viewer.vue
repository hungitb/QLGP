<template>
  <div ref="viewer" class="viewer">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  data() {
    return {};
  },
  methods: {
    mounted() {
      // To do
    },
    destroyed() {
      // To do
    },
  },
});
</script>

<style lang="scss">
.viewer {
}
</style>
