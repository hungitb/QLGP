<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" app>
      <div class="px-12 py-2">
        <v-img :src="require('@/assets/logo.png')" alt="Logo" />
      </div>

      <v-divider></v-divider>

      <v-list nav dense>
        <v-list-item-group v-model="selectedItem" color="primary">
          <v-list-item
            v-for="(item, i) in items"
            :key="item.title"
            link
            :to="item.link"
            :disabled="selectedItem == i"
          >
            <v-list-item-icon
              :style="{ fontSize: '18px', marginRight: '10px' }"
            >
              <i :class="`bi bi-${item.icon}`"></i>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>

      <template v-slot:append>
        <div class="pa-4">
          <v-btn block color="primary" @click="logout">
            Đăng xuất
            <v-icon right>mdi-logout</v-icon>
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar app dark color="primary">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <!-- <v-toolbar-title>Quản lý gia phả</v-toolbar-title> -->
    </v-app-bar>

    <v-main>
      <router-view v-if="!isLoadingUser"></router-view>
    </v-main>

    <FullViewLoading :tbb="true" v-if="isLoading"></FullViewLoading>
    <FullViewLoading v-if="isLoadingUser"></FullViewLoading>

    <!-- Force load, because in mobile view this is not pre load -->
    <v-img
      :src="require('@/assets/logo.png')"
      alt="Logo"
      style="display: none"
    />

    <!-- Import Utilities so that it is useable -->
    <ShowDialogAddOrCreatePerson />
    <ShowDialogAddPersonWithSpecificRole />
    <ShowDialogConfirm />
    <ShowSnackbar />
    <ShowImage />
    <UtilDialogPersonDetailInfo />
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
import UtilDialogPersonDetailInfo from "@/components/utilities/UtilDialogPersonDetailInfo.vue";

export default Vue.extend({
  components: {
    FullViewLoading,
    ShowDialogAddOrCreatePerson,
    ShowDialogAddPersonWithSpecificRole,
    ShowDialogConfirm,
    ShowSnackbar,
    ShowImage,
    UtilDialogPersonDetailInfo,
  },
  data: () => ({
    isLoading: false,
    isLoadingUser: true,
    interval: null as number | null,
    drawer: null as boolean | null,
    items: [
      { title: "Trang chủ", icon: "house-door-fill", link: "/" },
      { title: "Cây gia phả", icon: "diagram-3-fill", link: "/family_tree" },
      { title: "Thống kê", icon: "pie-chart-fill", link: "/statistic" },
      {
        title: "Sự kiện sắp tới",
        icon: "calendar-event-fill",
        link: "/upcoming_events",
      },
    ],
    selectedItem: 0,
  }),
  methods: {
    ...mapActions([FETCH_PEOPLE, CLEAR_STORE]),
    updateSelectedItemFromRoute(route: Route) {
      const matchingIndex = this.items.findIndex(
        (item) => item.link === route.path
      );
      this.selectedItem = matchingIndex !== -1 ? matchingIndex : 0;
    },
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
      return true;
    },
  },
  watch: {
    $route: "updateSelectedItemFromRoute",
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
      this.updateSelectedItemFromRoute(this.$route);

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
