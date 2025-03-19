<template>
  <div style="display: none">
    <DialogConfirm v-model="show" v-bind="props" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import DialogConfirm from "@/components/DialogConfirm.vue";

type ShowConfirmDialogParams = {
  onConfirmed: () => any;
  notAwaitOnConfirmed?: boolean;
  header: string;
  info?: string;
  confirmText?: string;
  confirmColor?: string;
};
let _showDialogConfirm: ((data: ShowConfirmDialogParams) => any) | null = null;
export function showDialogConfirm(data: ShowConfirmDialogParams) {
  if (_showDialogConfirm) {
    _showDialogConfirm(data);
  }
}

export default defineComponent({
  components: {
    DialogConfirm,
  },
  data() {
    return {
      show: false,
      props: { header: "" } as Record<string, any>,
    };
  },
  watch: {
    show(val) {
      if (!val) {
        this.props = { header: "" };
      }
    },
  },
  methods: {
    showDialogConfirm({ notAwaitOnConfirmed, ...data }: ShowConfirmDialogParams) {
      this.show = true;
      this.props = {
        ...data,
        ...(
          notAwaitOnConfirmed ? {
            callbackAfterClose: data.onConfirmed
          } : {
            callbackBeforeClose: data.onConfirmed
          }
        ),
      };
    },
  },
  mounted() {
    _showDialogConfirm = this.showDialogConfirm.bind(this);
  },
});
</script>
