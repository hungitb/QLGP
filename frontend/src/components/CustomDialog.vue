<template>
  <v-dialog v-model="dialog" persistent :max-width="maxWidth" scrollable>
    <template v-slot:activator="{ on, attrs }">
      <slot name="activator" v-bind:on="on" v-bind:attrs="attrs"></slot>
    </template>

    <v-card>
      <v-card-title>
        <span class="text-h5">{{ header }}</span>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text ref="cardText">
        <div class="pt-5">
          <slot></slot>
        </div>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          :text="buttonText || undefined"
          color="blue"
          @click="dialog = false"
          v-if="buttonSide == 'right'"
          >Đóng</v-btn
        >
        <v-btn
          v-for="{ click, color, text } in buttons"
          :key="text"
          :text="buttonText || undefined"
          :color="color || 'blue'"
          @click="click(closeDialog)"
          >{{ text }}</v-btn
        >
        <v-btn
          :text="buttonText || undefined"
          color="blue"
          @click="dialog = false"
          v-if="buttonSide != 'right'"
          >Đóng</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";

import { type CustomDialogButtonProp } from "./types";

export default Vue.extend({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    header: {
      type: String,
      required: true,
    },
    buttons: {
      type: Array as () => CustomDialogButtonProp[],
      default: () => [],
    },
    buttonText: {
      type: Boolean,
      default: false,
    },
    buttonSide: {
      type: String as () => "left" | "right",
      default: "right",
    },
    maxWidth: {
      type: String,
    },
    beforeShowAgain: {
      type: Function,
      required: false,
    },
  },
  data() {
    return {};
  },
  computed: {
    dialog: {
      get() {
        return (this as any).value;
      },
      set(newValue) {
        if (newValue) {
          (this as any).beforeShowAgain?.();
        }
        setTimeout(() => ((this as any).$refs.cardText.scrollTop = 0), 300);
        (this as any).$emit("input", newValue);
      },
    },
  },
  methods: {
    closeDialog() {
      (this as any).dialog = false;
    },
  },
});
</script>
