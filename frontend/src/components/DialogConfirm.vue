<template>
  <CustomDialog
    v-model="dialog"
    buttonText
    noDivider
    :header="header"
    :buttons="[{ text: confirmText, color: confirmColor, click }]"
    maxWidth="360px"
    :contentPaddingTop="false"
    :isLoading="isLoading"
  >
    {{ info }}
  </CustomDialog>
</template>

<script lang="ts">
import Vue from "vue";

import CustomDialog from "./CustomDialog.vue";

export default Vue.extend({
  components: {
    CustomDialog,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    header: {
      type: String,
      required: true,
    },
    info: {
      type: String,
      default: "",
    },
    confirmText: {
      type: String,
      default: "OK",
    },
    confirmColor: {
      type: String,
      default: undefined,
    },
    callbackBeforeClose: {
      type: Function,
    },
    callbackAfterClose: {
      type: Function,
    },
  },
  data() {
    return {
      isLoading: false,
    };
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
  methods: {
    async click() {
      if (this.callbackBeforeClose) {
        this.isLoading = true;
        await this.callbackBeforeClose();
        this.isLoading = false;
      }
      this.dialog = false;
      if (this.callbackAfterClose) {
        this.callbackAfterClose();
      }
    },
  },
});
</script>
