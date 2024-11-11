<template>
  <CustomDialog
    v-model="dialog"
    header="Thêm người thân"
    buttonText
    :buttons="buttons"
    maxWidth="600px"
    :beforeShowAgain="resetForm"
  >
    <template v-slot:activator="{ on, attrs }">
      <slot name="activator" v-bind:on="on" v-bind:attrs="attrs"></slot>
    </template>

    <v-form ref="form">
      <v-row>
        <v-col cols="12">
          <AvatarInput v-model="avartarSrc" :person="{ callname, gender }" />
        </v-col>
        <v-col cols="12" class="pt-5">
          <v-text-field
            label="Tên gọi *"
            outlined
            v-model="callname"
            :rules="callnameRules"
            validate-on-blur
          ></v-text-field>
        </v-col>
        <v-col cols="12">
          <v-radio-group label="Giới tính *" class="mt-0 pt-0" v-model="gender">
            <v-radio label="Nam" :value="Gender.MALE"></v-radio>
            <v-radio label="Nữ" :value="Gender.FEMALE"></v-radio>
          </v-radio-group>
        </v-col>
        <v-col cols="12">
          <DateInputGroup
            label="Ngày sinh"
            v-model="birthdayDataObj"
            ref="di1"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            :items="lifeStatusItems"
            label="Tình trạng"
            outlined
            v-model="status"
          ></v-select>
        </v-col>
        <v-col cols="12">
          <DateInputGroup
            label="Ngày mất"
            v-model="deathdayDataObj"
            :disabled="status != LifeStatus.DEAD"
            ref="di2"
          />
        </v-col>
        <v-col cols="12">
          <PersonInputGroup label="Bố" male one v-model="fatherId" />
        </v-col>
        <v-col cols="12">
          <PersonInputGroup label="Mẹ" female one v-model="motherId" />
        </v-col>
        <v-col cols="12">
          <PersonInputGroup label="Bạn đời" one v-model="spouseId" />
        </v-col>
      </v-row>
    </v-form>

    <small>* Không được để trống</small>
  </CustomDialog>
</template>

<script lang="ts">
import Vue from "vue";
import { LifeStatus, Gender } from "../../../general/model/Person";
import CustomDialog from "./CustomDialog.vue";
import { type CustomDialogButtonProp, DateFormat } from "./types";
import DateInputGroup from "./input/DateInputGroup.vue";
import PersonInputGroup from "./input/PersonInputGroup.vue";
import AvatarInput from "./input/AvatarInput.vue";

export default Vue.extend({
  components: {
    DateInputGroup,
    PersonInputGroup,
    CustomDialog,
    AvatarInput,
  },
  data() {
    return {
      dialog: true,
      LifeStatus,
      Gender,

      avartarSrc: null,
      callname: "",
      gender: Gender.MALE,
      birthdayDataObj: ["", DateFormat.dmy],
      status: "null",
      deathdayDataObj: ["", DateFormat.dmyAL],
      fatherId: null,
      motherId: null,
      spouseId: null,

      callnameRules: [(v: string) => !!v || "Không được để trống"],

      lifeStatusItems: [
        { value: "null", text: "Không rõ" },
        { value: LifeStatus.ALIVE, text: "Còn sống" },
        { value: LifeStatus.DEAD, text: "Đã mất" },
      ],
    };
  },
  computed: {
    buttons() {
      return [
        { text: "Lưu", click: (this as any).save },
      ] as CustomDialogButtonProp[];
    },
  },
  watch: {
    fatherId(v) {
      window.l(v);
    },
    motherId(v) {
      window.l(v);
    },
    avartarSrc(v) {
      window.l(v);
    },
  },
  methods: {
    resetForm() {
      this.avartarSrc = null;
      this.callname = "";
      this.gender = Gender.MALE;
      this.birthdayDataObj = ["", DateFormat.dmy];
      this.status = "null";
      this.deathdayDataObj = ["", DateFormat.dmyAL];
      this.fatherId = null;
      this.motherId = null;
      this.spouseId = null;

      (this.$refs.form as any)?.resetValidation?.();
    },
    save(closeDialog: () => void) {
      const valid = (this.$refs?.form as any)?.validate?.();
      if (valid) {
        closeDialog();
      }
    },
  },
});
</script>

<style lang="sass"></style>
