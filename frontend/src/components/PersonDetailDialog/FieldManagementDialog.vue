<template>
  <CustomDialog
    v-model="dialog"
    header="Các loại thông tin khác"
    buttonText
    maxWidth="600px"
  >
    <template v-if="fetchFieldDefsError">
      Không thể tìm thấy thông tin
    </template>
    <template v-else>
      <v-btn
        class="mb-3"
        @click="dialogAddFieldDef = true"
        color="primary"
        outlined
      >
        <v-icon left>mdi-plus</v-icon>
        Thêm loại thông tin
      </v-btn>
      <AddOrEditFieldDefDialog
        v-model="dialogAddFieldDef"
      ></AddOrEditFieldDefDialog>
      <v-data-table
        :headers="fieldDefTableHeaders"
        :loading="isLoadingFieldDefs"
        :items="fieldDefs || []"
      >
      </v-data-table>
    </template>
  </CustomDialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CustomDialog from "../CustomDialog.vue";
import { FieldDef } from "../../../../backend/src/model/FieldDef";
import { fieldDefApi } from "@/api/fieldDef";
import AddOrEditFieldDefDialog from "./AddOrEditFieldDefDialog.vue";

export default defineComponent({
  components: {
    CustomDialog,
    AddOrEditFieldDefDialog,
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      dialogAddFieldDef: false,
      fetchFieldDefsError: false,
      isLoadingFieldDefs: false,
      fieldDefs: undefined as FieldDef[] | undefined,
      fieldDefTableHeaders: [
        { text: "Tên", value: "name" },
        { text: "Mô tả", value: "description" },
        { text: "Loại", value: "type" },
        { text: "Dành cho", value: "isForAll" },
        { text: "", value: "__actions" },
      ] as { text: string; value: keyof FieldDef | "__actions" }[],
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
    value(v) {
      if (v) {
        this.fetchFieldDefs();
      }
    },
  },
  methods: {
    async fetchFieldDefs() {
      this.fetchFieldDefsError = false;
      this.isLoadingFieldDefs = true;

      const { data } = await fieldDefApi.getAllFieldDefs({});

      this.isLoadingFieldDefs = false;

      if ("msg" in data) {
        this.fetchFieldDefsError = true;
        return;
      }

      this.fieldDefs = data.fieldDefs;
    },
  },
  mounted() {
    if (this.dialog) {
      this.fetchFieldDefs();
    }
  },
});
</script>
