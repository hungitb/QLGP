<template>
  <v-row>
    <v-col cols="6">
      <v-text-field
        :label="label"
        class="pt-0 mt-0"
        :disabled="disabled"
        outlined
        v-model="content"
        hide-details
        :error="errorText != '' ? true : undefined"
        @blur="validate"
        @input="resetValidation"
      ></v-text-field>
    </v-col>
    <v-col cols="6">
      <v-select
        :items="items"
        :disabled="disabled"
        label="Định dạng nhập"
        v-model="dataType"
        hide-details
      ></v-select>
    </v-col>

    <!-- custom message -->
    <v-col cols="12" class="pt-0" style="margin-top: -4px">
      <div
        class="px-3 mb-2"
        style="
          color: #ff5252 !important;
          font-size: 12px;
          line-height: 12px;
          min-height: 14px;
        "
      >
        {{ errorText }}
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from "vue";
import type { PropType } from "vue";

import { DateFormat } from "../types";
import { dateValidationMessage } from "../../../../backend/src/utils/DateUtils";

export default Vue.extend({
  inject: ["form"],
  created() {
    (this as any).form.register(this);
  },
  props: {
    value: {
      type: Array as unknown as PropType<[string, DateFormat]>,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      items: [DateFormat.y, DateFormat.my, DateFormat.dmy, DateFormat.dmyAL],
      errorText: "",
    };
  },
  computed: {
    content: {
      get() {
        return this.value[0];
      },
      set(val: string) {
        this.emitDataChanged(val, undefined);
      },
    },
    dataType: {
      get() {
        return this.value[1];
      },
      set(val: DateFormat) {
        this.emitDataChanged(undefined, val);
      },
    },
  },
  watch: {
    dataType() {
      this.validate();
    },
  },
  methods: {
    emitDataChanged(content?: string, dataType?: DateFormat) {
      this.$emit("input", [
        content === undefined ? this.content : content,
        dataType || this.dataType,
      ]);
    },
    resetValidation() {
      this.errorText = "";
    },
    validate() {
      const validationOptionMapping = {
        [DateFormat.y]: { isMissingMonth: true },
        [DateFormat.my]: { isMissingDay: true },
        [DateFormat.dmy]: {},
        [DateFormat.dmyAL]: { isLunarDate: true },
      };

      let validationMessage: string | null = null;
      if (this.required && this.content == "") {
        validationMessage = "Không được để trống";
      } else {
        if (this.content != "") {
          validationMessage = dateValidationMessage(
            this.content,
            validationOptionMapping[this.dataType]
          );
        }
      }

      this.errorText = validationMessage || "";
      if (!validationMessage) return true;

      return false;
    },
  },
});
</script>
