<template>
  <div style="display: none">
    <AddPersonDialog
      v-model="dialogCreateOrEditPerson.show"
      :person="dialogCreateOrEditPerson.editedPerson"
      :callback="dialogCreateOrEditPerson.callbackWhenDone"
      :initData="dialogCreateOrEditPerson.initData"
      :role="dialogCreateOrEditPerson.roleOfAddedPerson"
    />

    <DialogConfirm v-model="dialogConfirm.show" v-bind="dialogConfirm.props" />

    <CustomDialog
      v-model="dialogAddPersonWithSpecificRole.show"
      max-width="400px"
      min-height="600px"
      buttonText
      :buttons="[
        {
          text: 'Lưu',
          click: dialogAddPersonWithSpecificRole.savePickedPerson || (() => 1),
        },
      ]"
      :isLoading="dialogAddPersonWithSpecificRole.isLoading"
    >
      <template v-slot:header>
        Thêm
        <span class="green--text">{{
          dialogAddPersonWithSpecificRole.props["roleText"]
        }}</span>
        cho
        <span class="green--text">{{
          dialogAddPersonWithSpecificRole.editedPerson?.callname
        }}</span>
      </template>

      <div class="mb-2">Chọn một người</div>
      <PersonInputGroup
        one
        ref="inputPersonDialogAddPersonWithSpecificRole"
        required
        v-model="dialogAddPersonWithSpecificRole.pickedPersonId"
        :label="dialogAddPersonWithSpecificRole.props['roleText'] || ''"
        :male="dialogAddPersonWithSpecificRole.props['role'] == 'father'"
        :mother="dialogAddPersonWithSpecificRole.props['role'] == 'mother'"
        :skipPeopleHasRelationshipWith="
          dialogAddPersonWithSpecificRole.editedPerson
        "
      />
      <div class="mb-1">Hoặc</div>
      <v-btn
        color="success"
        @click="dialogAddPersonWithSpecificRole.clickAddPerson"
      >
        Tạo người mới
      </v-btn>
    </CustomDialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Gender, Person } from "../../../general/model/Person";
import AddPersonDialog from "@/components/AddPersonDialog.vue";
import DialogConfirm from "@/components/DialogConfirm.vue";
import CustomDialog from "@/components/CustomDialog.vue";
import PersonInputGroup from "@/components/input/PersonInputGroup.vue";
import { personApi } from "@/api/person";
import { mapActions } from "vuex";
import { FETCH_PEOPLE } from "@/store";
import { CreatePersonParams } from "../../../general/controller/person";

type ShowAddOrEditPersonDialogParams = {
  person?: Person;
  onDone?: (createdOrUpdatedPersonId: string) => any;
  initData?: Partial<Person>;
  roleOfAddedPerson?: CreatePersonParams["role"];
};
let _showDialogAddOrCreatePerson:
  | ((data: ShowAddOrEditPersonDialogParams) => any)
  | null = null;
export function showDialogAddOrCreatePerson(
  data: ShowAddOrEditPersonDialogParams = {}
) {
  if (_showDialogAddOrCreatePerson) {
    _showDialogAddOrCreatePerson(data);
  }
}

type ShowConfirmDialogParams = {
  onConfirmed: () => any;
  header: string;
  info?: string;
  confirmText?: string;
  confirmColor?: string;
};
let _showDialogConfirm: ((data: ShowConfirmDialogParams) => any) | null = null;
export function showDialogConfirm(data: ShowConfirmDialogParams) {
  if (_showDialogConfirm) {
    _showDialogConfirm(data);
  }
}

type ShowDialogAddPersonWithSpecificRoleParams = {
  person: Person;
  roleOfPersonWillAdd: string;
  onAddedOrCreated?: (addedPersonId: string) => any;
};
let _showDialogAddPersonWithSpecificRole:
  | ((data: ShowDialogAddPersonWithSpecificRoleParams) => any)
  | null = null;
export function showDialogAddPersonWithSpecificRole(
  data: ShowDialogAddPersonWithSpecificRoleParams
) {
  if (_showDialogAddPersonWithSpecificRole) {
    _showDialogAddPersonWithSpecificRole(data);
  }
}

export default defineComponent({
  components: {
    AddPersonDialog,
    DialogConfirm,
    CustomDialog,
    PersonInputGroup,
  },
  data() {
    return {
      dialogCreateOrEditPerson: {
        show: false,
        editedPerson: null as Person | null,
        callbackWhenDone: undefined as
          | ((createdOrUpdatedPersonId: string) => any)
          | undefined,
        initData: {} as Partial<Person>,
        roleOfAddedPerson: undefined as CreatePersonParams["role"] | undefined,
      },

      dialogConfirm: {
        show: false,
        props: { header: "" } as Record<string, any>,
      },

      dialogAddPersonWithSpecificRole: {
        show: false,
        editedPerson: null as Person | null,
        props: {} as Record<string, any>,
        pickedPersonId: null as string | null,
        savePickedPerson: null as (() => any) | null,
        clickAddPerson: (() => 1) as () => any,
        isLoading: false,
      },
    };
  },
  watch: {
    "dialogCreateOrEditPerson.show"(val) {
      if (!val) {
        this.dialogCreateOrEditPerson.editedPerson = null;
        this.dialogCreateOrEditPerson.initData = {};
        this.dialogCreateOrEditPerson.roleOfAddedPerson = undefined;
      }
    },
    "dialogConfirm.show"(val) {
      if (!val) {
        this.dialogConfirm.props = { header: "" };
      }
    },
    "dialogAddPersonWithSpecificRole.show"(val) {
      if (!val) {
        this.dialogAddPersonWithSpecificRole.editedPerson = null;
        this.dialogAddPersonWithSpecificRole.props = {};
        this.dialogAddPersonWithSpecificRole.pickedPersonId = null;
        this.dialogAddPersonWithSpecificRole.savePickedPerson = null;
        this.dialogAddPersonWithSpecificRole.clickAddPerson = () => 1;
        this.dialogAddPersonWithSpecificRole.isLoading = false;
        (
          this.$refs.inputPersonDialogAddPersonWithSpecificRole as any
        ).resetValidation();
      }
    },
  },
  methods: {
    ...mapActions({
      [FETCH_PEOPLE]: FETCH_PEOPLE,
    }),
    showDialogAddOrCreatePerson({
      person,
      onDone,
      initData,
      roleOfAddedPerson,
    }: ShowAddOrEditPersonDialogParams) {
      this.dialogCreateOrEditPerson.show = true;
      // Check Trước khi set, nếu set cả thì phải quan tâm thứ tự. Trong Dialog add thì việc set sẽ set person sau initData
      if (person) this.dialogCreateOrEditPerson.editedPerson = person;
      if (initData) this.dialogCreateOrEditPerson.initData = initData;
      if (roleOfAddedPerson)
        this.dialogCreateOrEditPerson.roleOfAddedPerson = roleOfAddedPerson;
      this.dialogCreateOrEditPerson.callbackWhenDone = onDone;
    },
    showDialogConfirm(data: ShowConfirmDialogParams) {
      this.dialogConfirm.show = true;
      this.dialogConfirm.props = {
        ...data,
        callbackBeforeClose: data.onConfirmed,
      };
    },
    showDialogAddPersonWithSpecificRole({
      person,
      roleOfPersonWillAdd,
      onAddedOrCreated,
    }: ShowDialogAddPersonWithSpecificRoleParams) {
      this.dialogAddPersonWithSpecificRole.show = true;
      this.dialogAddPersonWithSpecificRole.editedPerson = person;
      const roleMapping: Record<string, string> = {
        spouse: "Bạn đời",
        child: "Con",
        father: "Bố",
        mother: "Mẹ",
      };
      this.dialogAddPersonWithSpecificRole.props = {
        role: roleOfPersonWillAdd,
        roleText: roleMapping[roleOfPersonWillAdd],
      };
      this.dialogAddPersonWithSpecificRole.savePickedPerson = async () => {
        const valid = (
          this.$refs.inputPersonDialogAddPersonWithSpecificRole as any
        ).validate();
        if (!valid || !this.dialogAddPersonWithSpecificRole.pickedPersonId)
          return;

        this.dialogAddPersonWithSpecificRole.isLoading = true;
        if (roleOfPersonWillAdd == "child") {
          await personApi.updatePerson({
            id: this.dialogAddPersonWithSpecificRole.pickedPersonId,
            ...(person.gender == Gender.MALE ? { fatherId: person.id } : {}),
            ...(person.gender == Gender.FEMALE ? { motherId: person.id } : {}),
          });
        } else {
          await personApi.updatePerson({
            id: person.id,
            ...(roleOfPersonWillAdd == "spouse"
              ? {
                  spouseId: this.dialogAddPersonWithSpecificRole.pickedPersonId,
                }
              : {}),
            ...(roleOfPersonWillAdd == "father"
              ? {
                  fatherId: this.dialogAddPersonWithSpecificRole.pickedPersonId,
                }
              : {}),
            ...(roleOfPersonWillAdd == "mother"
              ? {
                  motherId: this.dialogAddPersonWithSpecificRole.pickedPersonId,
                }
              : {}),
          });
        }

        if (onAddedOrCreated) {
          onAddedOrCreated(this.dialogAddPersonWithSpecificRole.pickedPersonId);
        }
        this.dialogAddPersonWithSpecificRole.isLoading = false;
        this.dialogAddPersonWithSpecificRole.show = false;
      };
      this.dialogAddPersonWithSpecificRole.clickAddPerson = () => {
        this.showDialogAddOrCreatePerson({
          initData: {
            ...(roleOfPersonWillAdd == "father" ? { gender: Gender.MALE } : {}),
            ...(roleOfPersonWillAdd == "mother"
              ? { gender: Gender.FEMALE }
              : {}),
            ...(roleOfPersonWillAdd == "spouse" ? { spouseId: person.id } : {}),
            ...(roleOfPersonWillAdd == "child"
              ? person.gender == Gender.MALE
                ? { fatherId: person.id }
                : { motherId: person.id }
              : {}),
          },
          roleOfAddedPerson: {
            roleName: roleOfPersonWillAdd,
            roleWithTargetPersonId: person.id,
          },
          onDone: (createdOrUpdatedPersonId) => {
            this.dialogAddPersonWithSpecificRole.show = false;
            if (onAddedOrCreated) {
              onAddedOrCreated(createdOrUpdatedPersonId);
            }
          },
        });
      };
    },
  },
  mounted() {
    _showDialogAddOrCreatePerson = this.showDialogAddOrCreatePerson.bind(this);
    _showDialogConfirm = this.showDialogConfirm.bind(this);
    _showDialogAddPersonWithSpecificRole =
      this.showDialogAddPersonWithSpecificRole.bind(this);
  },
});
</script>
