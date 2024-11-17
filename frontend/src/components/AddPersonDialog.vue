<template>
  <CustomDialog
    v-model="dialog"
    header="Thêm người thân"
    buttonText
    :buttons="buttons"
    maxWidth="600px"
    :beforeShowAgain="resetForm"
    :isLoading="isLoading"
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
import { personApi } from "@/api/person";
import { mapActions } from "vuex";
import { FETCH_PEOPLE } from "@/store";

export default Vue.extend({
  components: {
    DateInputGroup,
    PersonInputGroup,
    CustomDialog,
    AvatarInput,
  },
  data() {
    return {
      dialog: false,
      isLoading: false,
      LifeStatus,
      Gender,

      avartarSrc: null,
      callname: "",
      gender: Gender.MALE,
      birthdayDataObj: ["", DateFormat.dmy] as [date: string, type: DateFormat],
      status: "null",
      deathdayDataObj: ["", DateFormat.dmyAL] as [
        date: string,
        type: DateFormat
      ],
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
      if (v == this.spouseId) {
        this.spouseId = null;
      }
    },
    motherId(v) {
      if (v == this.spouseId) {
        this.spouseId = null;
      }
    },
    spouseId(v) {
      if (v == this.fatherId) {
        this.fatherId = null;
      }
      if (v == this.motherId) {
        this.motherId = null;
      }
    },
  },
  methods: {
    ...mapActions([FETCH_PEOPLE]),
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
    async save(closeDialog: () => void) {
      const valid = (this.$refs?.form as any)?.validate?.();
      if (!valid) return;

      function handleDateInputValue([date, type]: [
        date: string,
        type: DateFormat
      ]) {
        if (date == "") return null;
        return date + (type == DateFormat.dmyAL ? "AL" : "");
      }

      this.isLoading = true;

      await personApi.createPerson({
        person: {
          avatarUrl: this.avartarSrc,
          callname: this.callname,
          gender: this.gender,
          birthday: handleDateInputValue(this.birthdayDataObj),
          status: this.status == "null" ? null : (this.status as LifeStatus),
          deathday: handleDateInputValue(this.deathdayDataObj),
          fatherId: this.fatherId,
          motherId: this.motherId,
          spouseId: this.spouseId,
        },
      });

      await this[FETCH_PEOPLE]();

      this.isLoading = false;

      closeDialog();
    },
  },
});
</script>

<style lang="sass"></style>
