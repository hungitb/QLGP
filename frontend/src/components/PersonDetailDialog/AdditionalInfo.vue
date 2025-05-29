<template>
  <div>
    <v-card>
      <v-card-title>Thông tin khác</v-card-title>
      <template v-if="isLoading">
        <div class="d-flex align-center justify-center" style="height: 100px">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
        </div>
      </template>
      <v-card-subtitle v-if="data && data.length == 0">
        Không có thông tin khác
      </v-card-subtitle>
      <v-card-text v-if="data && data.length > 0"> Hello </v-card-text>
      <v-card-actions v-if="!isLoading && canWrite()">
        <v-btn
          v-if="data"
          text
          color="primary"
          @click="dialogEditAdditionalInfo = true"
        >
          <v-icon left>mdi-pen</v-icon>
          Chỉnh sửa
          <EditAdditionalInfoDialog
            v-model="dialogEditAdditionalInfo"
            :data="data"
          />
        </v-btn>
        <v-btn text color="primary" @click="dialogFieldManagement = true">
          <v-icon left>mdi-menu</v-icon>
          Quản lý
          <FieldManagementDialog
            v-model="dialogFieldManagement"
            @addOrUpdateField="someFieldCreatedOrChanged = true"
          />
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { FieldVal } from "../../../../backend/src/model/FieldVal";
import { FieldDef } from "../../../../backend/src/model/FieldDef";
import { permissionMixin } from "@/utils";
import FieldManagementDialog from "./FieldManagementDialog.vue";
import EditAdditionalInfoDialog from "./EditAdditionalInfoDialog.vue";

export default defineComponent({
  mixins: [permissionMixin],
  components: {
    FieldManagementDialog,
    EditAdditionalInfoDialog,
  },
  props: {
    data: {
      type: Array as PropType<
        (FieldVal & { fieldDef: FieldDef })[] | undefined
      >,
    },
  },
  data() {
    return {
      dialogFieldManagement: false,
      dialogEditAdditionalInfo: false,
      someFieldCreatedOrChanged: false,
    };
  },
  computed: {
    isLoading() {
      return (this as any).data === undefined;
    },
  },
  watch: {
    dialogFieldManagement(v: boolean) {
      // Chỉ emit event này để refresh data khi đóng dialog field management
      // Vì nếu emit luôn khi có thay đổi thì dialog field management có thể bị toggle
      if (!v && this.someFieldCreatedOrChanged) {
        this.$emit("addOrUpdateField");
        this.someFieldCreatedOrChanged = false;
      }
    },
  },
});
</script>
