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
      <v-card-text v-if="data && data.length > 0">
        Hello
      </v-card-text>
      <v-card-actions v-if="!isLoading">
        <v-btn text color="primary">
          <v-icon left>mdi-pen</v-icon>
          Chỉnh sửa
        </v-btn>
        <v-btn text color="primary">
          <v-icon left>mdi-menu</v-icon>
          Quản lý
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { FieldVal } from "../../../../backend/src/model/FieldVal";
import { FieldDef } from "../../../../backend/src/model/FieldDef";

export default defineComponent({
  props: {
    data: {
      type: Array as PropType<
        (FieldVal & { fieldDef: FieldDef })[] | undefined
      >,
    },
  },
  computed: {
    isLoading() {
      return this.data === undefined;
    },
  },
});
</script>
