<template>
  <div>
    <v-file-input
      v-model="v"
      :label="label"
      placeholder="Chọn ảnh"
      prepend-icon="mdi-paperclip"
      outlined
      accept="image/*"
    >
      <template v-slot:selection="{ file }">
        <div v-if="typeof file?.file == 'string'" class="py-3">
          <div
            class="image-input-preview-image-wrapper"
            @click.stop="handleClickPreviewImage(file.file)"
          >
            <v-img :src="file.file" :width="previewImageWidth" />
          </div>
        </div>
      </template>
    </v-file-input>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { showImage } from "../utilities";

export default defineComponent({
  props: {
    value: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
  },
  computed: {
    v: {
      get() {
        const value = (this as any).value as string;
        if (!value) return null;
        return { file: value };
      },
      set(file: File | null) {
        if (!file) {
          this.$emit("input", "");
          return;
        }

        // Thi thoảng debug in ra file thì nó in ra là: {__ob__: Observer}
        // Dự đoán có thể là do thằng file input có inner state nào đó, tạm thời cứ check cho chạy được đã
        if (file instanceof File) {
          // Trigger recalcaulte this.v để xóa value nội tại của thằng file input nó giữ file
          this.$emit("input", "");

          const reader = new FileReader();
          reader.onload = (e) => {
            const base64String = (e as any).target.result;
            this.$emit("input", base64String);
          };
          reader.readAsDataURL(file);
        }
      },
    },
    previewImageWidth() {
      const vw = this.$vuetify.breakpoint.width;

      if (vw < 450) {
        return 160;
      } else if (vw < 600) {
        return 240;
      }
      return 320;
    },
  },
  methods: {
    handleClickPreviewImage(src: string) {
      showImage({ src });
    },
  },
});
</script>

<style lang="scss">
.image-input-preview-image-wrapper {
  cursor: pointer;
  border: 1px solid transparent;

  &:hover {
    border-color: black;
  }
}
</style>
