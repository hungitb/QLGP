<template>
  <CustomDialog v-model="dialog" header="Chỉnh sửa thông tin" maxWidth="500px" buttonText persistent>
    <v-form>
      <template v-for="(f, i) in data">
        <div :key="i">
          <v-text-field v-if="f.fieldDef.type == 'TEXT'" v-model="newValue[f.id]" :label="f.fieldDef.name" outlined></v-text-field>
          <v-text-field v-if="f.fieldDef.type == 'COMPLEX_TEXT'" v-model="newValue[f.id]" :label="f.fieldDef.name" outlined></v-text-field>
          <DateInputGroup v-if="f.fieldDef.type == 'DATE'" :value="getDateInputValue(f.value)" @input="newValue[f.id] = transformDateInputValue($event)" :label="f.fieldDef.name"></DateInputGroup>
        </div>
      </template>
    </v-form>
  </CustomDialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { FieldVal } from '../../../../backend/src/model/FieldVal';
import { FieldDef } from '../../../../backend/src/model/FieldDef';
import CustomDialog from '../CustomDialog.vue';
import DateInputGroup from '../input/DateInputGroup.vue';
import { convertToDateInputValue, handleDateInputValue } from '@/utils';
import { DateFormat } from '../types';

function getInitValue(data: (FieldVal & { fieldDef: FieldDef })[]) {
  const result: Record<string, string> = {};
  data.forEach(fv => {
    result[fv.id] = fv.value || "";
  });
  return result;
}

export default defineComponent({
  components: {
    CustomDialog, DateInputGroup
  },
  props: {
    value: {
      type: Boolean,
      required: true
    },
    data: {
      type: Array as PropType<
        (FieldVal & { fieldDef: FieldDef })[]
      >,
      required: true
    },
  },
  data() {
    return {
      newValue: getInitValue(this.data)
    };
  },
  computed: {
    dialog: {
      get() {
        return (this as any).value as boolean;
      },
      set(v: boolean) {
        this.$emit("input", v);
      }
    }
  },
  watch: {
    data(v) {
      this.newValue = getInitValue(v);
    }
  },
  methods: {
    getDateInputValue(v: string | null) {
      return convertToDateInputValue(v as any, DateFormat.dmy);
    },
    transformDateInputValue(v: [
  date: string,
  type: DateFormat
]) {
  return handleDateInputValue(v) || "";
}
  }
})
</script>