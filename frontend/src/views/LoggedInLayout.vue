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
            Logout
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
      <router-view></router-view>
    </v-main>

    <FullViewLoading :tbb="true" v-if="isLoading"></FullViewLoading>
    <FullViewLoading v-if="isLoadingUser"></FullViewLoading>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import type { Route } from "vue-router";

import { authApi } from "@/api/auth";
import FullViewLoading from "@/components/FullViewLoading.vue";

export default Vue.extend({
  components: {
    FullViewLoading,
  },
  data: () => ({
    isLoading: false,
    isLoadingUser: true,
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
    setSelectedItem(index: number) {
      this.selectedItem = index;
    },
    updateSelectedItemFromRoute(route: Route) {
      const matchingIndex = this.items.findIndex(
        (item) => item.link === route.path
      );
      this.selectedItem = matchingIndex !== -1 ? matchingIndex : 0;
    },
    async logout() {
      this.isLoading = true;
      await authApi.logout();
      this.$router.push("/auth/login");
    },
  },
  watch: {
    $route: "updateSelectedItemFromRoute",
  },
  async mounted() {
    const { data, status } = await authApi.getLoggedInUser();
    if (status > 299 || !data.user) {
      this.$router.push("/auth/login");
      return;
    }

    this.isLoadingUser = false;
    this.updateSelectedItemFromRoute(this.$route);
  },
});
</script>
