<template>
  <v-app>
    <template v-if="$store.state.user">
      <v-navigation-drawer v-model="drawer" app>
        <div class="px-12 py-2">
          <v-img :src="require('@/assets/logo.png')" alt="Logo" eager />
        </div>

        <v-divider></v-divider>

        <v-list dense>
          <v-list-item>
            <v-list-item-icon>
              <v-icon>mdi-account</v-icon>
            </v-list-item-icon>
            <v-list-item-title>{{
              $store.state.user.username
            }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="dialogChangePassword = true">
            <v-list-item-icon>
              <v-icon>mdi-lock-reset</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Đổi mật khẩu</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout">
            <v-list-item-icon>
              <v-icon>mdi-logout</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Đăng xuất</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <CustomDialog
        v-model="dialogChangePassword"
        :isLoading="loadingDialogChangePassword"
        header="Đổi mật khẩu"
        maxWidth="480"
        buttonText
        :buttons="[
          {
            text: 'Đổi mật khẩu',
            click: changePassword,
            color: 'warning'
          },
        ]"
      >
        <v-form ref="formChangePassword">
          <v-text-field
            v-model="changePasswordForm.oldPassword"
            label="Mật khẩu cũ"
            outlined
            :rules="usernamePasswordRules"
            validate-on-blur
            :type="changePasswordForm.showOldPassword ? 'text' : 'password'"
            :append-icon="
              changePasswordForm.showOldPassword ? 'mdi-eye' : 'mdi-eye-off'
            "
            @click:append="
              changePasswordForm.showOldPassword =
                !changePasswordForm.showOldPassword
            "
          />
          <v-text-field
            v-model="changePasswordForm.newPassword"
            label="Mật khẩu mới"
            outlined
            :rules="usernamePasswordRules"
            validate-on-blur
            :type="changePasswordForm.showNewPassword ? 'text' : 'password'"
            :append-icon="
              changePasswordForm.showNewPassword ? 'mdi-eye' : 'mdi-eye-off'
            "
            @click:append="
              changePasswordForm.showNewPassword =
                !changePasswordForm.showNewPassword
            "
          />
          <v-text-field
            v-model="changePasswordForm.confirmPassword"
            label="Xác nhận mật khẩu mới"
            outlined
            :rules="[checkConfirmPassword]"
            validate-on-blur
            :type="changePasswordForm.showConfirmPassword ? 'text' : 'password'"
            :append-icon="
              changePasswordForm.showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'
            "
            @click:append="
              changePasswordForm.showConfirmPassword =
                !changePasswordForm.showConfirmPassword
            "
          />
        </v-form>
      </CustomDialog>

      <v-app-bar app dark color="primary" id="app-bar">
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-toolbar-title>Quản lý gia phả</v-toolbar-title>
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
        <v-btn v-for="({ title, icon, link }, i) in items" :key="i" :to="link">
          <span>{{ title }}</span>
          <v-icon>{{ icon }}</v-icon>
        </v-btn>
      </v-bottom-navigation>
    </template>

    <FullViewLoading :tbb="true" v-if="isLoading"></FullViewLoading>
    <FullViewLoading v-if="isLoadingUser"></FullViewLoading>

    <!-- Import Utilities so that it is useable -->
    <ShowDialogAddOrCreatePerson />
    <ShowDialogAddPersonWithSpecificRole />
    <ShowDialogConfirm />
    <ShowSnackbar :app="!drawer" />
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
import { CLEAR_STORE, FETCH_PEOPLE, UPDATE_USER } from "@/store";
import ShowDialogAddOrCreatePerson from "@/components/utilities/ShowDialogAddOrCreatePerson.vue";
import ShowDialogAddPersonWithSpecificRole from "@/components/utilities/ShowDialogAddPersonWithSpecificRole.vue";
import ShowDialogConfirm from "@/components/utilities/ShowDialogConfirm.vue";
import ShowSnackbar, { showSnackbar } from "@/components/utilities/ShowSnackbar.vue";
import ShowImage from "@/components/utilities/ShowImage.vue";
import ShowDialogPersonDetailInfo from "@/components/utilities/ShowDialogPersonDetailInfo.vue";
import CustomDialog from "@/components/CustomDialog.vue";
import { usernamePasswordRules } from "../../../backend/src/controller/utils";

function initChangePasswordForm() {
  return {
    showOldPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
}

export default Vue.extend({
  components: {
    FullViewLoading,
    ShowDialogAddOrCreatePerson,
    ShowDialogAddPersonWithSpecificRole,
    ShowDialogConfirm,
    ShowSnackbar,
    ShowImage,
    ShowDialogPersonDetailInfo,
    CustomDialog,
  },
  data: () => ({
    isLoading: false,
    isLoadingUser: true,
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

    loadingDialogChangePassword: false,
    usernamePasswordRules,
    dialogChangePassword: false,
    changePasswordForm: initChangePasswordForm(),
  }),
  methods: {
    ...mapActions([FETCH_PEOPLE, CLEAR_STORE, UPDATE_USER]),
    checkConfirmPassword(v: string) {
      for (const rule of this.usernamePasswordRules) {
        const result = rule(this.changePasswordForm.newPassword);
        if (typeof result == "string") {
          return true;
        }
      }
      if (v == this.changePasswordForm.newPassword) {
        return true;
      }

      return "Không khớp với mật khẩu đã nhập";
    },
    async changePassword() {
      const isValid = (this.$refs.formChangePassword as any).validate();
      if (!isValid) return;

      this.loadingDialogChangePassword = true;
      const { data, status } = await authApi.changePassword({
        oldPassword: this.changePasswordForm.oldPassword,
        newPassword: this.changePasswordForm.newPassword,
      });
      this.loadingDialogChangePassword = false;

      var errorMessage: string | null = null;
      if (status == 0) {
        errorMessage = "Không thể kết nối tới Server";
      }
      if (status > 299) {
        errorMessage = data.msg || "Có lỗi xảy ra";
      }

      if (errorMessage) {
        showSnackbar({
          msg: errorMessage,
          type: "error",
        });
      } else {
        showSnackbar({
          msg: "Đổi mật khẩu thành công",
        });
        this.dialogChangePassword = false;
      }
    },
    updateSelectedItemFromRoute(route: Route) {
      window.scrollTo(0, 0);
      this.checkUser();

      let matchingIndex = -1;
      let bestMatchLength = -1;
      this.items.forEach((item, index) => {
        if (
          route.path.startsWith(item.link) &&
          item.link.length > bestMatchLength
        ) {
          matchingIndex = index;
          bestMatchLength = item.link.length;
        }
      });
      this.selectedItem = matchingIndex !== -1 ? matchingIndex : 0;
    },
    async logout() {
      this.isLoading = true;
      await authApi.logout({});
      this[CLEAR_STORE]();
      this.$router.push("/auth/login");
    },
    async checkUser() {
      const { data, status } = await authApi.getLoggedInUser();
      if (status > 299 || !("user" in data) || !data.user) {
        if (window.location.pathname == "/") {
          this.$router.push("/auth/login");
        } else {
          this.$router.push("/auth/login?next=" + window.location.pathname);
        }
        return false;
      }
      this[UPDATE_USER]({ user: data.user });
      return true;
    },
  },
  watch: {
    $route: "updateSelectedItemFromRoute",
    dialogChangePassword(value) {
      if (value) {
        (this.$refs.formChangePassword as any).resetValidation();
        this.changePasswordForm = initChangePasswordForm();
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
