<template>
  <v-dialog v-model="dialog" fullscreen>
    <div id="image-dialog-wrapper" class="d-flex align-center justify-center">
      <v-img :src="src" contain max-width="100%" max-height="100%"></v-img>
    </div>

    <v-btn
      text
      fab
      dark
      absolute
      top
      right
      @click="dialog = false"
      style="top: 16px"
    >
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";

type ShowImageParams = {
  src: string;
};
let _showImage: ((data: ShowImageParams) => any) | undefined = undefined;
export function showImage(data: ShowImageParams) {
  if (_showImage) {
    _showImage(data);
  }
}

export default defineComponent({
  data() {
    return {
      dialog: false,
      src: "",
    };
  },
  methods: {
    showImage({ src }: ShowImageParams) {
      this.dialog = true;
      this.src = src;
    },
  },
  mounted() {
    _showImage = this.showImage;
  },
});
</script>

<style>
#image-dialog-wrapper {
  width: 100%;
  height: 100%;
  padding: 100px 0;
  background-color: black;
}
</style>
