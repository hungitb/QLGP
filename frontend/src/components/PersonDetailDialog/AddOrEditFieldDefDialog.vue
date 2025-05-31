<template>
  <CustomDialog
    v-model="dialog"
    :header="toEdit ? 'Cập nhật loại thông tin' : 'Thêm loại thông tin'"
    persistent
    maxWidth="500px"
    buttonText
    :buttons="[{ text: 'Lưu', click: save }]"
    :isLoading="savingData"
  >
    <v-form ref="form">
      <v-text-field
        v-model="name"
        outlined
        label="Tên (bắt buộc)"
        :rules="[ruleRequired]"
      ></v-text-field>
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
import { FieldDataToEdit } from "../../../../backend/src/controller/fieldDef";
import { fieldDefApi } from "@/api/fieldDef";

export default defineComponent({
  components: {
    CustomDialog,
    PersonInputGroup,
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    // If pass this value, mean that this dialog is for update
    toEdit: {
      type: Object as () => FieldDataToEdit,
    },
  },
  data() {
    return {
      ruleRequired: (v: string) => !!v || "Không được để trống",
      typeSelectItems: ALL_FIELD_TYPES.map((type) => ({
        value: type,
        text: fieldTypeDisplayText[type],
      })),
      name: this.toEdit?.name || "",
      description: this.toEdit?.description || "",
      type: "TEXT" as FieldType,
      isForAll: true,
      specificPersonId: null as string | null,
      savingData: false,
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
    toEdit(v: FieldDataToEdit) {
      this.name = v?.name || "";
      this.description = v?.description || "";
    },
    isForAll(v: boolean) {
      if (v) {
        this.specificPersonId = null;
      }
    },
  },
  methods: {
    async save() {
      const isValid = (this.$refs as any).form.validate();
      if (!isValid) return;

      this.savingData = true;

      if (this.toEdit) {
        await fieldDefApi.updateFieldDef({
          data: {
            id: this.toEdit.id,
            name: this.name,
            description: this.description,
          },
        });
      } else {
        const baseData = {
          name: this.name,
          description: this.description,
          type: this.type,
        };

        const data: typeof baseData &
          ({ isForAll: true } | { isForAll: false; specificPersonId: string }) =
          this.isForAll
            ? Object.assign(baseData, { isForAll: true } as const)
            : Object.assign(baseData, {
                isForAll: false,
                specificPersonId: this.specificPersonId!,
              } as const);

        await fieldDefApi.createFieldDef({ data });
      }

      this.savingData = false;

      this.$emit("addOrUpdate");
    },
  },
});
</script>
