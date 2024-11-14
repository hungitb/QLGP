<template>
  <v-app>
    <FullViewLoading v-if="isLoadingUser"></FullViewLoading>

    <v-container fluid fill-height v-else>
      <v-layout align-center justify-center>
        <div style="width: 400px">
          <router-view></router-view>
        </div>
      </v-layout>
    </v-container>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";

import FullViewLoading from "@/components/FullViewLoading.vue";
import { authApi } from "@/api/auth";

export default Vue.extend({
  components: {
    FullViewLoading,
  },
  data: function () {
    return {
      isLoadingUser: true,
    };
  },
  async mounted() {
    const { data, status } = await authApi.getLoggedInUser();
    if (status <= 299 && data.user) {
      this.$router.push("/");
      return;
    }

    this.isLoadingUser = false;
  },
});
</script>
