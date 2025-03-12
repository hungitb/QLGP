<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" app>
      <div class="px-12 py-2">
        <v-img :src="require('@/assets/logo.png')" alt="Logo" eager />
      </div>

      <v-divider></v-divider>

      <div class="px-3 mt-2 text-subtitle-1 primary--text">
        Xin chào {{ user?.username }}!
      </div>

      <template v-slot:append>
        <div class="pa-4">
          <v-btn block color="primary" @click="logout">
            Đăng xuất
            <v-icon right>mdi-logout</v-icon>
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar app dark color="primary" id="app-bar">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <!-- <v-toolbar-title>Quản lý gia phả</v-toolbar-title> -->
    </v-app-bar>

    <v-main>
      <router-view v-if="!isLoadingUser"></router-view>
    </v-main>

    <v-bottom-navigation
      app
      id="bottom-navigation"
      color="primary"
      grow
      v-model="selectedItem"
    >
      <v-btn v-for="({ title, icon }, i) in items" :key="i">
        <span>{{ title }}</span>
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
    </v-bottom-navigation>

    <FullViewLoading :tbb="true" v-if="isLoading"></FullViewLoading>
    <FullViewLoading v-if="isLoadingUser"></FullViewLoading>

    <!-- Import Utilities so that it is useable -->
    <ShowDialogAddOrCreatePerson />
    <ShowDialogAddPersonWithSpecificRole />
    <ShowDialogConfirm />
    <ShowSnackbar />
    <ShowImage />
    <ShowDialogPersonDetailInfo />
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import type { Route } from "vue-router";

import { authApi } from "@/api/auth";
import FullViewLoading from "@/components/FullViewLoading.vue";
import { mapActions } from "vuex";
import { CLEAR_STORE, FETCH_PEOPLE } from "@/store";
import ShowDialogAddOrCreatePerson from "@/components/utilities/ShowDialogAddOrCreatePerson.vue";
import ShowDialogAddPersonWithSpecificRole from "@/components/utilities/ShowDialogAddPersonWithSpecificRole.vue";
import ShowDialogConfirm from "@/components/utilities/ShowDialogConfirm.vue";
import ShowSnackbar from "@/components/utilities/ShowSnackbar.vue";
import ShowImage from "@/components/utilities/ShowImage.vue";
import ShowDialogPersonDetailInfo from "@/components/utilities/ShowDialogPersonDetailInfo.vue";
import { User } from "../../../backend/src/model/User";

export default Vue.extend({
  components: {
    FullViewLoading,
    ShowDialogAddOrCreatePerson,
    ShowDialogAddPersonWithSpecificRole,
    ShowDialogConfirm,
    ShowSnackbar,
    ShowImage,
    ShowDialogPersonDetailInfo,
  },
  data: () => ({
    isLoading: false,
    isLoadingUser: true,
    user: null as User | null,
    interval: null as number | null,
    drawer: null as boolean | null,
    items: [
      { title: "Trang chủ", icon: "mdi-home", link: "/" },
      {
        title: "Cây gia phả",
        icon: "$bootstrap-diagram-3-fill",
        link: "/family_tree",
      },
      {
        title: "Sự kiện",
        icon: "mdi-calendar",
        link: "/upcoming_events",
      },
      { title: "Tiện ích", icon: "mdi-apps", link: "/utilities" },
    ],
    selectedItem: 0,
  }),
  methods: {
    ...mapActions([FETCH_PEOPLE, CLEAR_STORE]),
    async logout() {
      this.isLoading = true;
      await authApi.logout();
      this[CLEAR_STORE]();
      this.$router.push("/auth/login");
    },
    async checkUser() {
      const { data, status } = await authApi.getLoggedInUser();
      if (status > 299 || !data.user) {
        if (window.location.pathname == "/") {
          this.$router.push("/auth/login");
        } else {
          this.$router.push("/auth/login?next=" + window.location.pathname);
        }
        return false;
      }
      this.user = data.user;
      return true;
    },
  },
  watch: {
    selectedItem(v: number) {
      window.scrollTo(0, 0);
      const newLink = this.items[v].link;
      if (newLink != this.$route.path) {
        this.$router.push(this.items[v].link);
      }
    },
  },
  async mounted() {
    // Mặc dù nếu không ok thì đã push route nhưng, route chưa kịp load thì code vẫn chạy tới
    // đoạn FETCH_PEOPLE và sẽ nhận 404 (api sẽ tự chuyển sang page /login với next là page hiện tại nhưng
    // page hiện tại khi nhận 404 lại là login nên thành ra page login xong lại chuyển đến page login).
    // Nên cần phải có check ok đoạn này.
    const ok = await this.checkUser();
    if (ok) {
      this.interval = setInterval(() => {
        this.checkUser();
      }, 30_000);
      this.isLoadingUser = false;

      let matchingIndex = -1;
      let bestMatchLength = -1;
      this.items.forEach((item, index) => {
        if (
          this.$route.path.startsWith(item.link) &&
          item.link.length > bestMatchLength
        ) {
          matchingIndex = index;
          bestMatchLength = item.link.length;
        }
      });
      this.selectedItem = matchingIndex !== -1 ? matchingIndex : 0;

      this[FETCH_PEOPLE]();
    }
  },
  beforeDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  },
});
</script>
