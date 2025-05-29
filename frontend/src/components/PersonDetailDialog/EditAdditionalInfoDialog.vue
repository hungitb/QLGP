<template>
  <CustomDialog
    v-model="dialog"
    header="Chỉnh sửa thông tin"
    maxWidth="500px"
    buttonText
    persistent
    :buttons="[{ text: 'Lưu', click: saveData }]"
    :isLoading="loading"
  >
    <v-form>
      <template v-for="(f, i) in data">
        <div :key="i">
          <v-text-field
            v-if="f.fieldDef.type == 'TEXT'"
            v-model="newValue[f.id]"
            :label="f.fieldDef.name"
            outlined
          ></v-text-field>
          <v-textarea
            v-if="f.fieldDef.type == 'COMPLEX_TEXT'"
            v-model="newValue[f.id]"
            :label="f.fieldDef.name"
            outlined
          ></v-textarea>
          <DateInputGroup
            v-if="f.fieldDef.type == 'DATE'"
            :value="getDateInputValue(f.value)"
            @input="newValue[f.id] = transformDateInputValue($event)"
            :label="f.fieldDef.name"
          ></DateInputGroup>
          <PersonInputGroup
            v-if="f.fieldDef.type == 'PERSON_REF'"
            v-model="newValue[f.id]"
            one
            :label="f.fieldDef.name"
          ></PersonInputGroup>
          <ImageInput
            v-if="f.fieldDef.type == 'IMAGE'"
            v-model="newValue[f.id]"
            :label="f.fieldDef.name"
          />
          <v-checkbox
            v-if="f.fieldDef.type == 'CHECKBOX'"
            class="mt-0"
            :input-value="!!newValue[f.id]"
            @change="newValue[f.id] = $event ? 'checked' : ''"
            :label="f.fieldDef.name"
          ></v-checkbox>
        </div>
      </template>
    </v-form>
  </CustomDialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { FieldVal } from "../../../../backend/src/model/FieldVal";
import { FieldDef } from "../../../../backend/src/model/FieldDef";
import CustomDialog from "../CustomDialog.vue";
import DateInputGroup from "../input/DateInputGroup.vue";
import { convertToDateInputValue, handleDateInputValue } from "@/utils";
import { DateFormat } from "../types";
import PersonInputGroup from "../input/PersonInputGroup.vue";
import ImageInput from "../input/ImageInput.vue";
import { fieldValApi } from "@/api/fieldDef";

function getInitValue(data: (FieldVal & { fieldDef: FieldDef })[]) {
  const result: Record<string, string> = {};
  data.forEach((fv) => {
    result[fv.id] = fv.value || "";
  });
  return result;
}

export default defineComponent({
  components: {
    CustomDialog,
    DateInputGroup,
    PersonInputGroup,
    ImageInput,
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    data: {
      type: Array as PropType<(FieldVal & { fieldDef: FieldDef })[]>,
      required: true,
    },
  },
  data() {
    return {
      newValue: getInitValue(this.data),
      loading: false,
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
        this.newValue = getInitValue(this.data);
      }
    },
    data(v) {
      this.newValue = getInitValue(v);
    },
  },
  methods: {
    getDateInputValue(v: string | null) {
      return convertToDateInputValue(v as any, DateFormat.dmy);
    },
    transformDateInputValue(v: [date: string, type: DateFormat]) {
      return handleDateInputValue(v) || "";
    },
    async saveData() {
      const changedFieldValIds = this.data.filter(fv => fv.value != this.newValue[fv.id]).map(fv => fv.id);

      this.loading = true;
      await fieldValApi.updateFieldVal({ data: changedFieldValIds.map(id => ({ id, value: this.newValue[id] })) });
      this.loading = false;

      this.$emit("someFieldValsChange");
    },
  },
});
</script>
