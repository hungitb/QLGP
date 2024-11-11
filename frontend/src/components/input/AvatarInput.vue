<template>
  <!-- Padding để giống các loại input khác của vuetify -->
  <div class="d-flex" style="padding-bottom: 30px">
    <CustomPersonAvatar
      size="70"
      class="mr-4"
      :person="computedPerson"
      textSize="4"
    />
    <div class="d-flex flex flex-column justify-space-between">
      Ảnh đại diện

      <input
        type="file"
        hidden
        ref="fileInput"
        accept="image/*"
        @change="onImageUploaded"
      />
      <div>
        <v-btn
          v-if="!imgSrc"
          outlined
          color="primary"
          @click="triggerFileInput"
        >
          <v-icon left>mdi-file-image-plus-outline</v-icon>
          Tải lên
        </v-btn>

        <v-btn v-else outlined color="error" @click="removeUploadedImage">
          <v-icon left>mdi-trash-can-outline</v-icon>
          Xóa ảnh
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import CustomPersonAvatar from "../CustomPersonAvatar.vue";

export default Vue.extend({
  components: {
    CustomPersonAvatar,
  },
  props: {
    value: {
      required: true,
    },
    person: {
      required: true,
    },
  },
  computed: {
    imgSrc: {
      get() {
        return (this as any).value;
      },
      set(value) {
        (this as any).$emit("input", value);
      },
    },
    computedPerson() {
      return {
        callname: (this as any).person.callname,
        gender: (this as any).person.gender,
        avatarUrl: (this as any).imgSrc,
      };
    },
  },
  methods: {
    triggerFileInput() {
      (this.$refs as any).fileInput.click();
    },
    removeUploadedImage() {
      (this as any).imgSrc = null;
    },
    onImageUploaded(event: any) {
      const input = event.target as HTMLInputElement;
      const file = input?.files?.[0];
      input.value = "";
      if (file) {
        (this as any).imgSrc = null;

        const fileReader = new FileReader();
        fileReader.onload = (e) => {
          (this as any).imgSrc = e.target?.result as string;
        };
        fileReader.readAsDataURL(file);
      }
    },
  },
});
</script>
