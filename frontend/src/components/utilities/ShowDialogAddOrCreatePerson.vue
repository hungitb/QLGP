<template>
  <div style="display: none">
    <AddPersonDialog
      v-model="show"
      :person="editedPerson"
      :callback="callbackWhenDone"
      :initData="initData"
      :role="roleOfAddedPerson"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { Person } from "../../../../backend/src/model/Person";
import AddPersonDialog from "@/components/AddPersonDialog.vue";
import { CreatePersonParams } from "../../../../backend/src/controller/person";

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

export default defineComponent({
  components: {
    AddPersonDialog,
  },
  data() {
    return {
      show: false,
      editedPerson: null as Person | null,
      callbackWhenDone: undefined as
        | ((createdOrUpdatedPersonId: string) => any)
        | undefined,
      initData: {} as Partial<Person>,
      roleOfAddedPerson: undefined as CreatePersonParams["role"] | undefined,
    };
  },
  watch: {
    show(val) {
      if (!val) {
        this.editedPerson = null;
        this.initData = {};
        this.roleOfAddedPerson = undefined;
      }
    },
  },
  methods: {
    showDialogAddOrCreatePerson({
      person,
      onDone,
      initData,
      roleOfAddedPerson,
    }: ShowAddOrEditPersonDialogParams) {
      this.show = true;
      // Check Trước khi set, nếu set cả thì phải quan tâm thứ tự. Trong Dialog add thì việc set sẽ set person sau initData
      if (person) this.editedPerson = person;
      if (initData) this.initData = initData;
      if (roleOfAddedPerson) this.roleOfAddedPerson = roleOfAddedPerson;
      this.callbackWhenDone = onDone;
    },
  },
  mounted() {
    _showDialogAddOrCreatePerson = this.showDialogAddOrCreatePerson.bind(this);
  },
});
</script>
