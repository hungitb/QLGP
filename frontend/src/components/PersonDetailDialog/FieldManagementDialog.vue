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
        @addOrUpdate="onAddOrUpdateFieldHandler"
      ></AddOrEditFieldDefDialog>
      <v-data-table
        :headers="fieldDefTableHeaders"
        :loading="isLoadingFieldDefs"
        :items="fieldDefs || []"
      >
        <template v-slot:item.type="{ value }">
          {{ fieldTypeDisplayText[value] }}
        </template>

        <template v-slot:item.isForAll="{ value, item }">
          <template v-if="value">
            Mọi người
          </template>
          <template v-else>
            {{ $store.state.personMapping[item.specificPersonId].callname }}
          </template>
        </template>

        <template v-slot:item.__actions="{ item }">
          <v-icon class="mr-4" @click.stop="editField(item)">
                  mdi-pencil
                </v-icon>

                <v-icon color="error" @click.stop="deleteField(item)">
                  mdi-delete
                </v-icon>
        </template>
      </v-data-table>

      <AddOrEditFieldDefDialog
        v-if="targetFieldDefToEditData"
        v-model="dialogEditFieldDef"
        :toEdit="targetFieldDefToEditData"
        @addOrUpdate="onAddOrUpdateFieldHandler"
      ></AddOrEditFieldDefDialog>
    </template>
  </CustomDialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CustomDialog from "../CustomDialog.vue";
import { FieldDef, fieldTypeDisplayText } from "../../../../backend/src/model/FieldDef";
import { fieldDefApi } from "@/api/fieldDef";
import AddOrEditFieldDefDialog from "./AddOrEditFieldDefDialog.vue";
import { ExtendedFieldDef, FieldDataToEdit } from "../../../../backend/src/controller/fieldDef";
import CustomPersonAvatar from "../CustomPersonAvatar.vue";
import { showDialogConfirm } from "../utilities";

export default defineComponent({
  components: {
    CustomDialog,
    AddOrEditFieldDefDialog
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      fieldTypeDisplayText,
      dialogAddFieldDef: false,
      dialogEditFieldDef: false,
      targetFieldDefToEditData: null as FieldDataToEdit | null,
      fetchFieldDefsError: false,
      isLoadingFieldDefs: false,
      fieldDefs: undefined as ExtendedFieldDef[] | undefined,
      fieldDefTableHeaders: [
        { text: "Tên", value: "name" },
        { text: "Mô tả", value: "description" },
        { text: "Loại", value: "type" },
        { text: "Dành cho", value: "isForAll" },
        { text: "", value: "__actions", sortable: false },
      ] as { text: string; value: keyof ExtendedFieldDef | "__actions" }[],
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
    onAddOrUpdateFieldHandler() {
      this.dialogAddFieldDef = false;
      this.dialogEditFieldDef = false;
      this.fetchFieldDefs();
      this.$emit("addOrUpdateField");
    },
    editField(field: ExtendedFieldDef) {
      this.dialogEditFieldDef = true;
      this.targetFieldDefToEditData = field;
    },
    deleteField(field: ExtendedFieldDef) {
      showDialogConfirm({
        header: `Bạn có chắc chắn muốn xóa "${field.name}"?`,
        info: `${field.isForAll ? "Tất cả mọi người" : this.$store.state.personMapping[field.specificPersonId].callname} sẽ mất đi trường thông tin này!`,
        confirmText: "Chắc chắn",
        confirmColor: "error",
        onConfirmed: async () => {
          await fieldDefApi.deleteFieldDef({ id: field.id });
          this.onAddOrUpdateFieldHandler();
        }
      });
    }
  },
  mounted() {
    if (this.dialog) {
      this.fetchFieldDefs();
    }
  },
});
</script>
