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
import PersonDetailDialog from "../PersonDetailDialog/PersonDetailDialog.vue";
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
      timeoutClearData: null as number | null,

      personId: "",
      editable: undefined as boolean | undefined,
      onPersonDeleted: undefined as (() => any) | undefined,
      onPersonEdited: undefined as (() => any) | undefined,
    };
  },
  watch: {
    dialog(v) {
      // Thường thì sẽ không cần reset nhưng nếu sử dụng component có inner state thì phải reset cho chắc.
      // Ví dụ đối với PersonDetailDialog, có 1 inner state là innerPersonId thể hiện người sẽ hiển thị.
      // Mỗi lần bấm thay đổi người thì giá trị của innerPersonId sẽ thay đổi theo.
      // Mặc dù innerPersonId đang watch personId, mỗi khi personId thay đổi thì innerPersonId thay đổi theo nhưng có trường hợp thế này.
      // Xem detail person A, personId = A, innerPersonId = A. Bấm sang xem B, innerPersonId = B. Bấm close dialog.
      // Bấm lại xem detail A, personID = A không đổi, watcher personId không cập nhật lại innerPersonId => Vẫn hiện B
      if (!v) {
        // Set timeout để khi đóng animation không bị giật
        this.timeoutClearData = setTimeout(() => {
          this.timeoutClearData = null;

          this.personId = "";
          this.editable = undefined;
          this.onPersonDeleted = undefined;
          this.onPersonEdited = undefined;
        }, 1000);
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
      if (this.timeoutClearData) {
        clearTimeout(this.timeoutClearData);
      }

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
