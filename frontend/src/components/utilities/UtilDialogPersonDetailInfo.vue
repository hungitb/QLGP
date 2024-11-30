<template>
  <div style="display: none">
    <PersonDetailDialog v-model="dialog" :personId="personId" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PersonDetailDialog from "../PersonDetailDialog.vue";

type ShowDialogPersonDetailInfoParams = {
  personId: string;
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
  data() {
    return {
      dialog: false,

      personId: "",
    };
  },
  watch: {
    dialog(val) {
      if (!val) {
        this.personId = "";
      }
    },
  },
  methods: {
    showDialogPersonDetailInfo({ personId }: ShowDialogPersonDetailInfoParams) {
      this.dialog = true;
      this.personId = personId;
    },
  },
  mounted() {
    _showDialogPersonDetailInfo = this.showDialogPersonDetailInfo.bind(this);
  },
});
</script>
