<template>
  <div>
    <v-btn color="primary" outlined @click="exportData">Save data</v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { exportData } from "../../../../backend/src/DAO/FakeDAO";
import { todayDate } from "../../../../backend/src/utils/DateUtils";

export default defineComponent({
  methods: {
    async exportData() {
      const data = await exportData();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([data], { type: "text/plain" }));
      link.download = `QLGP_data_${todayDate().replaceAll("/", "-")}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    },
  },
});
</script>
