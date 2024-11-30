<template>
  <v-dialog
    v-model="dialog"
    :persistent="persistent || isLoading"
    :max-width="maxWidth"
    scrollable
    @click.stop
  >
    <v-card style="position: relative">
      <v-card-title v-if="header || $slots.header">
        <!-- Mặc định do vuetify set word-break=break-all làm cho chữ bị gãy khi xuống dòng nên pahri set lại -->
        <span class="text-h5" style="word-break: initial">
          <slot name="header">{{ header }}</slot>
        </span>
      </v-card-title>
      <v-divider v-if="divider && (header || $slots.header)"></v-divider>
      <v-card-text :class="noPadding ? 'pa-0' : ''" ref="cardText">
        <div :class="contentPaddingTop && !noPadding ? 'pt-5' : ''">
          <slot></slot>
        </div>
      </v-card-text>
      <v-divider v-if="divider"></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          :text="buttonText || undefined"
          color="blue"
          @click.stop="dialog = false"
          v-if="buttonSide == 'right'"
          >Đóng</v-btn
        >
        <v-btn
          v-for="{ click, color, text } in buttons"
          :key="text"
          :text="buttonText || undefined"
          :color="color || 'blue'"
          @click.stop="click"
          >{{ text }}</v-btn
        >
        <v-btn
          :text="buttonText || undefined"
          color="blue"
          @click.stop="dialog = false"
          v-if="buttonSide != 'right'"
          >Đóng</v-btn
        >
      </v-card-actions>

      <div
        v-if="isLoading"
        class="d-flex align-center justify-center"
        style="
          position: absolute;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.1);
        "
      >
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
      </div>
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
      default: "",
    },
    persistent: {
      type: Boolean,
      default: true,
    },
    buttons: {
      type: Array as () => CustomDialogButtonProp[],
      default: () => [],
    },
    // Button có viền hay không: buttonText == true tương đương với không viền
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
    beforeClose: {
      type: Function,
      required: false,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    divider: {
      type: Boolean,
      default: true,
    },
    // Dùng cho setting event, dùng cái list padding hơi lạ nên mình phải có cái này
    noPadding: {
      type: Boolean,
      default: false,
    },
    // Do sử dụng thẻ v-card nên bình thường phần content sẽ không có padding top.
    // Thường sẽ set = false cho DialogConfirm
    contentPaddingTop: {
      type: Boolean,
      default: true,
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
      set(newValue: any) {
        (this as any).$emit("input", newValue);
      },
    } as unknown as () => boolean,
  },
  watch: {
    value(newValue) {
      if (!newValue) {
        setTimeout(() => {
          this.scrollTop();
          (this as any).beforeClose?.();
        }, 300);
      }
    },
  },
  methods: {
    scrollTop() {
      if ((this as any).$refs.cardText) {
        (this as any).$refs.cardText.scrollTop = 0;
      }
    },
  },
});
</script>
