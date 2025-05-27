<template>
  <CustomDialog
    v-model="dialog"
    :header="toEdit ? 'Cập nhật loại thông tin' : 'Thêm loại thông tin'"
    persistent
    maxWidth="500px"
    buttonText
    :buttons="[{ text: 'Lưu', click: save }]"
  >
    <v-form ref="form">
    <v-text-field v-model="name" outlined label="Tên (bắt buộc)" :rules="[ruleRequired]"></v-text-field>
    <v-text-field v-model="description" outlined label="Mô tả"></v-text-field>
    <template v-if="!toEdit">
      <v-select
        v-model="isForAll"
        outlined
        :items="[
          { value: true, text: 'Cho tất cả mọi người' },
          { value: false, text: 'Chọn người cụ thể' },
        ]"
        label="Đối tượng thêm loại thông tin này"
      ></v-select>
      <PersonInputGroup
        v-if="!isForAll"
        v-model="specificPersonId"
        one
        label="Đối tượng (bắt buộc)"
        required
      ></PersonInputGroup>
      <v-select
        v-model="type"
        outlined
        :items="typeSelectItems"
        label="Loại"
      ></v-select>
    </template>

    </v-form>
  </CustomDialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Prettify, SafeOmit } from "../../../../backend/src/controller/utils";
import {
  ALL_FIELD_TYPES,
  FieldDef,
  FieldType,
  fieldTypeDisplayText,
} from "../../../../backend/src/model/FieldDef";
import CustomDialog from "../CustomDialog.vue";
import PersonInputGroup from "../input/PersonInputGroup.vue";

export default defineComponent({
  components: {
    CustomDialog, PersonInputGroup
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    // If pass this value, mean that this dialog is for update
    toEdit: {
      type: Object as () => Prettify<
        SafeOmit<FieldDef, "createdAt" | "id" | "isForAll" | "type">
      >,
    },
  },
  data() {
    return {
      ruleRequired: (v: string) => !!v || "Không được để trống",
      typeSelectItems: ALL_FIELD_TYPES.map((type) => ({
        value: type,
        text: fieldTypeDisplayText[type],
      })),
      name: "",
      description: "",
      type: "TEXT" as FieldType,
      isForAll: true,
      specificPersonId: null as string | null,
    };
  },
  computed: {
    dialog: {
      get() {
        return (this as any).value as boolean;
      },
      set(v: boolean) {
        this.$emit("input", v);
      },
    },
  },
  watch: {
    value(v: boolean) {
      if (v) {
        (this.$refs as any).form?.resetValidation();
        this.name = this.toEdit?.name || "";
        this.description = this.toEdit?.description || "";
        this.type = "TEXT";
        this.isForAll = true;
        this.specificPersonId = null;
      }
    },
    toEdit(v: typeof this.toEdit) {
      this.name = v?.name || "";
      this.description = v?.description || "";
    },
    isForAll(v: boolean) {
      if (v) {
        this.specificPersonId = null;
      }
    }
  },
  methods: {
    save() {
      const isValid = (this.$refs as any).form.validate();
      if (!isValid) return;
    }
  }
});
</script>
