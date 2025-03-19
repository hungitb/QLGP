<template>
  <div style="display: none">
    <PersonDetailDialog
      v-model="dialog"
      :personId="personId"
      :editable="editable && canWrite()"
      :onPersonEdited="onPersonEdited"
      :onPersonDeleted="onPersonDeleted"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PersonDetailDialog from "../PersonDetailDialog.vue";
import { permissionMixin } from "@/utils";

type ShowDialogPersonDetailInfoParams = {
  personId: string;
  editable?: boolean;
  onPersonDeleted?: () => any;
  onPersonEdited?: () => any;
};
let _showDialogPersonDetailInfo:
  | ((data: ShowDialogPersonDetailInfoParams) => any)
  | undefined = undefined;
export function showDialogPersonDetailInfo(
  data: ShowDialogPersonDetailInfoParams
) {
  if (_showDialogPersonDetailInfo) {
    _showDialogPersonDetailInfo(data);
  }
}

export default defineComponent({
  components: {
    PersonDetailDialog,
  },
  mixins: [permissionMixin],
  data() {
    return {
      dialog: false,

      personId: "",
      editable: undefined as boolean | undefined,
      onPersonDeleted: undefined as (() => any) | undefined,
      onPersonEdited: undefined as (() => any) | undefined,
    };
  },
  watch: {
    dialog(val) {
      if (!val) {
        this.personId = "";
        this.editable = undefined;
      }
    },
  },
  methods: {
    showDialogPersonDetailInfo({
      personId,
      editable,
      onPersonDeleted,
      onPersonEdited,
    }: ShowDialogPersonDetailInfoParams) {
      this.dialog = true;
      this.personId = personId;
      this.editable = editable;
      this.onPersonDeleted = onPersonDeleted;
      this.onPersonEdited = onPersonEdited;
    },
  },
  mounted() {
    _showDialogPersonDetailInfo = this.showDialogPersonDetailInfo.bind(this);
  },
});
</script>
