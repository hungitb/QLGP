<template>
  <v-btn
    x-small
    outlined
    depressed
    color="primary"
    @click="$emit('click', $event)"
  >
    <v-icon left dark> mdi-account-plus </v-icon>
    <slot></slot>
  </v-btn>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({});
</script>
