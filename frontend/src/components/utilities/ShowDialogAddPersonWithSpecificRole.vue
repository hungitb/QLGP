<template>
  <div style="display: none">
    <CustomDialog
      v-model="show"
      max-width="400px"
      min-height="600px"
      buttonText
      :buttons="[
        {
          text: 'Lưu',
          click: savePickedPerson || (() => 1),
        },
      ]"
      :isLoading="isLoading"
    >
      <template v-slot:header>
        Thêm
        <span class="green--text">{{ props["roleText"] }}</span>
        cho
        <span class="green--text">{{ editedPerson?.callname }}</span>
      </template>

      <div class="mb-2">Chọn một người</div>
      <PersonInputGroup
        one
        v-model="pickedPersonId"
        :label="props['roleText'] || ''"
        :male="props['role'] == 'father'"
        :female="props['role'] == 'mother'"
        :skipPeopleHasRelationshipWith="editedPerson"
      />
      <div class="mb-1">Hoặc</div>
      <v-btn
        color="success"
        @click="clickAddPerson"
        :disabled="!!pickedPersonId"
      >
        Tạo người mới
      </v-btn>
    </CustomDialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { Gender, Person } from "../../../../backend/src/model/Person";
import { showDialogAddOrCreatePerson } from "./ShowDialogAddOrCreatePerson.vue";
import CustomDialog from "@/components/CustomDialog.vue";
import PersonInputGroup from "@/components/input/PersonInputGroup.vue";
import { personApi } from "@/api/person";
import { showSnackbar } from "./ShowSnackbar.vue";

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
    CustomDialog,
    PersonInputGroup,
  },
  data() {
    return {
      show: false,
      editedPerson: null as Person | null,
      props: {} as Record<string, any>,
      pickedPersonId: null as string | null,
      savePickedPerson: null as (() => any) | null,
      clickAddPerson: (() => 1) as () => any,
      isLoading: false,
    };
  },
  watch: {
    show(val) {
      if (!val) {
        this.editedPerson = null;
        this.props = {};
        this.pickedPersonId = null;
        this.savePickedPerson = null;
        this.clickAddPerson = () => 1;
        this.isLoading = false;
      }
    },
  },
  methods: {
    showDialogAddPersonWithSpecificRole({
      person,
      roleOfPersonWillAdd,
      onAddedOrCreated,
    }: ShowDialogAddPersonWithSpecificRoleParams) {
      this.show = true;
      this.editedPerson = person;
      const roleMapping: Record<string, string> = {
        spouse: "Bạn đời",
        child: "Con",
        father: "Bố",
        mother: "Mẹ",
      };
      this.props = {
        role: roleOfPersonWillAdd,
        roleText: roleMapping[roleOfPersonWillAdd],
      };
      this.savePickedPerson = async () => {
        if (!this.pickedPersonId) {
          showSnackbar({
            msg: `Bạn chưa chọn ${this.props.roleText} cho ${this.editedPerson?.callname}`,
          });
          return;
        }

        this.isLoading = true;
        if (roleOfPersonWillAdd == "child") {
          await personApi.updatePerson({
            id: this.pickedPersonId,
            ...(person.gender == Gender.MALE ? { fatherId: person.id } : {}),
            ...(person.gender == Gender.FEMALE ? { motherId: person.id } : {}),
          });
        } else {
          await personApi.updatePerson({
            id: person.id,
            ...(roleOfPersonWillAdd == "spouse"
              ? {
                  spouseId: this.pickedPersonId,
                }
              : {}),
            ...(roleOfPersonWillAdd == "father"
              ? {
                  fatherId: this.pickedPersonId,
                }
              : {}),
            ...(roleOfPersonWillAdd == "mother"
              ? {
                  motherId: this.pickedPersonId,
                }
              : {}),
          });
        }

        showSnackbar({
          msg: `Thêm ${roleMapping[roleOfPersonWillAdd]} cho ${
            person.callname
          } thành công (thêm ${
            this.$store.state.personMapping[this.pickedPersonId].callname
          })`,
        });

        if (onAddedOrCreated) {
          onAddedOrCreated(this.pickedPersonId);
        }
        this.isLoading = false;
        this.show = false;
      };
      this.clickAddPerson = () => {
        showDialogAddOrCreatePerson({
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
            this.show = false;
            if (onAddedOrCreated) {
              onAddedOrCreated(createdOrUpdatedPersonId);
            }
          },
        });
      };
    },
  },
  mounted() {
    _showDialogAddPersonWithSpecificRole =
      this.showDialogAddPersonWithSpecificRole.bind(this);
  },
});
</script>
