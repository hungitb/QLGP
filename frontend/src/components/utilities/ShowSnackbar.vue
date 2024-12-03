<template>
  <v-snackbar v-model="snackbar" color="primary">
    {{ msg }}

    <template v-slot:action="{ attrs }">
      <v-btn text v-bind="attrs" @click="snackbar = false"> Đóng </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import { defineComponent } from "vue";

type ShowSnackbarParams = {
  msg: string;
  type?: "info" | "success";
};
let _showSnackbar: ((data: ShowSnackbarParams) => any) | undefined = undefined;
export function showSnackbar(data: ShowSnackbarParams) {
  if (_showSnackbar) {
    _showSnackbar(data);
  }
}

export default defineComponent({
  data() {
    return {
      snackbar: false,
      msg: "",
      type: "info" as Exclude<ShowSnackbarParams["type"], undefined>,
    };
  },
  watch: {
    snackbar(val) {
      if (!val) {
        this.msg = "";
        this.type = "info";
      }
    },
  },
  methods: {
    showSnackbar({ msg, type }: ShowSnackbarParams) {
      this.snackbar = true;
      this.type = type || "info";
      this.msg = msg;
    },
  },
  mounted() {
    _showSnackbar = this.showSnackbar;
  },
});
</script>
