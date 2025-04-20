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
  // Không giống các util khác, util này vẫn phải theo dõi show để reset form
  // Vì cơ chế của AddPersonDialog khá phức tạp về reset form (thực ra bad code :v)
  // Khi set initData thì phải làm sớm, nếu set sau thì nó sẽ reset thông tin của person. Nên buộc phải reset ở đây chứ không phải trong hàm showDialogAddOrCreatePerson
  // Nếu trong hàm showDialogAddOrCreatePerson thực hiện set initData trước rồi set editedPerson sau thì watcher của editedPerson vẫn kích hoạt trước.
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
