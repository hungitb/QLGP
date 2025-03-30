<template>
  <CustomDialog
    v-model="dialog"
    :header="
      person ? 'Cập nhật thông tin ' + person.callname : 'Thêm người thân'
    "
    buttonText
    :buttons="buttons"
    maxWidth="600px"
    :beforeClose="resetForm"
    :isLoading="isLoading"
  >
    <v-form ref="form">
      <v-row>
        <v-col cols="12">
          <AvatarInput
            v-model="avartarSrc"
            :person="{ callname, gender }"
            :disabled="isConstant('avatarUrl')"
          />
        </v-col>
        <v-col cols="12" class="pt-5">
          <v-text-field
            label="Tên gọi *"
            outlined
            v-model="callname"
            :rules="callnameRules"
            validate-on-blur
            :disabled="isConstant('callname')"
          ></v-text-field>
        </v-col>
        <v-col cols="12">
          <v-radio-group
            label="Giới tính *"
            class="mt-0 pt-0"
            v-model="gender"
            :disabled="isConstant('gender')"
          >
            <v-radio label="Nam" :value="Gender.MALE"></v-radio>
            <v-radio label="Nữ" :value="Gender.FEMALE"></v-radio>
          </v-radio-group>
        </v-col>
        <v-col cols="12">
          <DateInputGroup
            label="Ngày sinh"
            v-model="birthdateDataObj"
            ref="di1"
            :disabled="isConstant('birthdate')"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            :items="lifeStatusItems"
            label="Tình trạng"
            outlined
            v-model="status"
            :disabled="isConstant('status')"
          ></v-select>
        </v-col>
        <v-col cols="12">
          <DateInputGroup
            label="Ngày mất"
            v-model="deathdateDataObj"
            :disabled="status != LifeStatus.DEAD || isConstant('deathdate')"
            ref="di2"
          />
        </v-col>
        <v-col cols="12">
          <PersonInputGroup
            label="Bố"
            male
            one
            v-model="fatherId"
            :exceptionIds="exceptionIdsOfPersonInput('father')"
            :disabled="isConstant('fatherId')"
          />
        </v-col>
        <v-col cols="12">
          <PersonInputGroup
            label="Mẹ"
            female
            one
            v-model="motherId"
            :exceptionIds="exceptionIdsOfPersonInput('mother')"
            :disabled="isConstant('motherId')"
          />
        </v-col>
        <v-col cols="12">
          <PersonInputGroup
            label="Bạn đời"
            one
            v-model="spouseId"
            :exceptionIds="exceptionIdsOfPersonInput('spouse')"
            :disabled="isConstant('spouseId')"
          />
        </v-col>
      </v-row>
    </v-form>

    <small>* Không được để trống</small>
  </CustomDialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { LifeStatus, Gender, Person } from "../../../backend/src/model/Person";
import CustomDialog from "./CustomDialog.vue";
import { type CustomDialogButtonProp, DateFormat } from "./types";
import DateInputGroup from "./input/DateInputGroup.vue";
import PersonInputGroup from "./input/PersonInputGroup.vue";
import AvatarInput from "./input/AvatarInput.vue";
import { personApi } from "@/api/person";
import { mapActions } from "vuex";
import { FETCH_PEOPLE } from "@/store";
import { convertToDateInputValue, handleDateInputValue } from "@/utils";
import { CreatePersonParams } from "../../../backend/src/controller/person";
import { showSnackbar } from "./utilities/ShowSnackbar.vue";

export default defineComponent({
  components: {
    DateInputGroup,
    PersonInputGroup,
    CustomDialog,
    AvatarInput,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    initData: {
      type: Object as () => Partial<Person>,
      default: () => ({}),
    },
    role: {
      type: Object as () => CreatePersonParams["role"],
    },
    // Không có person thì tương đương thêm mới, nếu có person thì update person đó
    person: {
      type: Object as () => Person | null,
      default: null,
    },
    callback: {
      type: Function,
    },
  },
  data() {
    return {
      isLoading: false,
      LifeStatus,
      Gender,

      avartarSrc: null as string | null,
      callname: "",
      gender: Gender.MALE,
      birthdateDataObj: ["", DateFormat.dmy] as [
        date: string,
        type: DateFormat
      ],
      status: LifeStatus.ALIVE as LifeStatus | "null",
      deathdateDataObj: ["", DateFormat.dmyAL] as [
        date: string,
        type: DateFormat
      ],
      fatherId: null as string | null,
      motherId: null as string | null,
      spouseId: null as string | null,

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
    dialog: {
      get() {
        return (this as any).value;
      },
      set(newValue: any) {
        (this as any).$emit("input", newValue);
      },
    } as unknown as () => boolean,
  },
  watch: {
    person() {
      this.loadPersonProp();
    },
    initData() {
      this.resetForm();
    },
    status(val) {
      if (val != LifeStatus.DEAD) {
        this.deathdateDataObj = ["", DateFormat.dmyAL];
      }
    },
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
    ...mapActions({
      [FETCH_PEOPLE]: FETCH_PEOPLE,
    }),
    exceptionIdsOfPersonInput(type: string) {
      const ids: string[] = [];
      if (this.person) ids.push(this.person.id);
      if (this.role) {
        const role = this.role.roleName;
        const id = this.role.roleWithTargetPersonId;
        const addForTypes = (...types: string[]) => {
          types.forEach((allowedType) => {
            if (allowedType == type && !ids.includes(id)) ids.push(id);
          });
        };
        if (role == "child") {
          if (this.$store.state.personMapping[id].gender == Gender.MALE) {
            addForTypes("mother", "spouse");
          } else {
            addForTypes("father", "spouse");
          }
        } else if (role == "spouse") {
          addForTypes("mother", "father");
        }
      }
      return ids;
    },
    loadPersonProp() {
      const person = this.person;
      if (person) {
        this.callname = person.callname;
        this.gender = person.gender;
        this.avartarSrc = person.avatarUrl;
        this.birthdateDataObj = convertToDateInputValue(
          person.birthdate,
          DateFormat.dmy
        );
        this.status = person.status || "null";
        this.deathdateDataObj = convertToDateInputValue(
          person.deathdate,
          DateFormat.dmyAL
        );
        this.fatherId = person.fatherId;
        this.motherId = person.motherId;
        this.spouseId = person.spouseId;
      }
    },
    resetForm() {
      const initData = this.initData as Person;
      this.avartarSrc = this.isConstant("avatarUrl")
        ? initData.avatarUrl
        : null;
      this.callname = this.isConstant("callname") ? initData.callname : "";
      this.gender = this.isConstant("gender") ? initData.gender : Gender.MALE;
      this.birthdateDataObj = this.isConstant("birthdate")
        ? convertToDateInputValue(initData.birthdate, DateFormat.dmy)
        : ["", DateFormat.dmy];
      this.status = this.isConstant("status")
        ? initData.status || "null"
        : LifeStatus.ALIVE;
      this.deathdateDataObj = this.isConstant("deathdate")
        ? convertToDateInputValue(initData.deathdate, DateFormat.dmyAL)
        : ["", DateFormat.dmyAL];
      this.fatherId = this.isConstant("fatherId") ? initData.fatherId : null;
      this.motherId = this.isConstant("motherId") ? initData.motherId : null;
      this.spouseId = this.isConstant("spouseId") ? initData.spouseId : null;

      (this.$refs.form as any)?.resetValidation?.();
    },
    isConstant(field: keyof Person) {
      return (Object as any).hasOwn(this.initData, field) as boolean;
    },
    async save() {
      const valid = (this.$refs?.form as any)?.validate?.();
      if (!valid) {
        if (this.callname == "") {
          showSnackbar({ msg: "Không được để trống Tên gọi" });
        }
        return;
      }

      this.isLoading = true;

      let addedOrCreatedPersonId = this.person?.id;

      if (this.person) {
        // Update person
        const data: Partial<Person> & { id: string } = { id: this.person.id };
        if (this.avartarSrc != this.person.avatarUrl)
          data.avatarUrl = this.avartarSrc;
        if (this.callname != this.person.callname)
          data.callname = this.callname;
        if (this.gender != this.person.gender) data.gender = this.gender;
        if (
          handleDateInputValue(this.birthdateDataObj) != this.person.birthdate
        )
          data.birthdate = handleDateInputValue(this.birthdateDataObj);
        if (this.status == "null" && this.person.status) data.status = null;
        if (this.status != "null" && this.status != this.person.status)
          data.status = this.status as LifeStatus;
        if (handleDateInputValue(this.deathdateDataObj) != this.person.gender)
          data.deathdate = handleDateInputValue(this.deathdateDataObj);
        if (this.fatherId != this.person.fatherId)
          data.fatherId = this.fatherId;
        if (this.motherId != this.person.motherId)
          data.motherId = this.motherId;
        if (this.spouseId != this.person.spouseId)
          data.spouseId = this.spouseId;

        await personApi.updatePerson(data);
        showSnackbar({
          msg: `Cập nhật thông tin ${this.callname} thành công`,
        });
      } else {
        // Add person
        const { data } = await personApi.createPerson({
          person: {
            avatarUrl: this.avartarSrc || null,
            callname: this.callname,
            gender: this.gender,
            birthdate: handleDateInputValue(this.birthdateDataObj),
            status: this.status == "null" ? null : (this.status as LifeStatus),
            deathdate: handleDateInputValue(this.deathdateDataObj),
            fatherId: this.fatherId,
            motherId: this.motherId,
            spouseId: this.spouseId,
          },
          role: this.role
            ? {
                roleName: this.role.roleName,
                roleWithTargetPersonId: this.role.roleWithTargetPersonId,
              }
            : undefined,
        });

        this.isLoading = false;

        if (!("createdPersonId" in data)) {
          showSnackbar({
            msg: "Có lỗi xảy ra",
            type: "error",
          });
          return;
        }

        addedOrCreatedPersonId = data.createdPersonId;
        if (this.role) {
          const roleMapping: Record<string, string> = {
            spouse: "Bạn đời",
            child: "Con",
            father: "Bố",
            mother: "Mẹ",
          };
          showSnackbar({
            msg: `Thêm ${roleMapping[this.role.roleName]} cho ${
              this.$store.state.personMapping[this.role.roleWithTargetPersonId]
                .callname
            } thành công (thêm ${this.callname})`,
          });
        } else {
          showSnackbar({
            msg: `Thêm người thân ${this.callname} thành công`,
          });
        }
      }

      this[FETCH_PEOPLE]();
      this.dialog = false;

      if (this.callback) {
        this.callback(addedOrCreatedPersonId as string);
      }
    },
  },
  mounted() {
    if (this.person) {
      this.loadPersonProp();
    } else {
      this.resetForm();
    }
  },
});
</script>
