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
        <div v-for="(f, i) in data" :key="i" class="mb-4">
          <template v-if="f.fieldDef.type == 'TEXT'">
            <div class="font-weight-bold">{{ f.fieldDef.name }}</div>
            <div>{{ f.value || nullValueDisplayText }}</div>
          </template>
          <template v-if="f.fieldDef.type == 'COMPLEX_TEXT'">
            <div class="font-weight-bold">{{ f.fieldDef.name }}</div>
            <template v-if="f.value">
              <div v-for="(line, j) in f.value.split('\n')" :key="j">{{ line }}</div>
            </template>
            <div v-else>{{ nullValueDisplayText }}</div>
          </template>
          <template v-if="f.fieldDef.type == 'DATE'">
            <div class="font-weight-bold">{{ f.fieldDef.name }}</div>
            <div>{{ f.value ? transformDateString(f.value) : nullValueDisplayText }}</div>
          </template>
          <template v-if="f.fieldDef.type == 'CHECKBOX'">
            <v-checkbox :input-value="!!f.value" readonly :label="f.fieldDef.name" hide-details class="mb-4 pt-0"></v-checkbox>
          </template>
          <template v-if="f.fieldDef.type == 'IMAGE'">
            <div class="font-weight-bold">{{ f.fieldDef.name }}</div>
            <v-img v-if="f.value" :src="f.value" @click="showImage(f.value)" style="cursor: pointer"></v-img>
            <div v-else>{{ nullValueDisplayText }}</div>
          </template>
          <template v-if="f.fieldDef.type == 'PERSON_REF'">
            <div class="font-weight-bold">{{ f.fieldDef.name }}</div>
            <div v-if="f.value" class="d-flex align-center">
              <div>
                <CustomPersonAvatar :person="$store.state.personMapping[f.value]" size="24"></CustomPersonAvatar>
              </div>
              <div class="ml-2">
                {{ $store.state.personMapping[f.value].callname }}
              </div>
            </div>
            <div v-else>{{ nullValueDisplayText }}</div>
          </template>
        </div>
      </v-card-text>
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
            @someFieldValsChange="someFieldValsChangeHandler"
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
import { transformDateString } from "../../../../backend/src/utils/DateUtils";
import { showImage } from "../utilities";
import CustomPersonAvatar from "../CustomPersonAvatar.vue";

export default defineComponent({
  mixins: [permissionMixin],
  components: {
    FieldManagementDialog,
    EditAdditionalInfoDialog,
    CustomPersonAvatar
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
      nullValueDisplayText: "Không có thông tin",
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
  methods: {
    someFieldValsChangeHandler() {
      this.$emit('someFieldValsChange');
      this.dialogEditAdditionalInfo = false;
    },
    transformDateString(s: string) {
      return transformDateString(s as any);
    },
    showImage(src: string) {
      showImage({ src });
    }
  }
});
</script>
