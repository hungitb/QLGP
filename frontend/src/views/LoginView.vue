<template>
  <v-sheet>
    <v-img
      :src="require('@/assets/logo.png')"
      class="mb-8 mx-auto"
      style="width: 160px"
      eager
    />
    <div class="text-h5 text-center font-weight-medium mb-8">
      Đăng nhập vào tài khoản của bạn
    </div>
    <v-form v-model="valid" ref="form">
      <v-row>
        <v-col cols="12" class="py-0">
          <v-text-field
            v-model="username"
            :rules="rules"
            label="Tên đăng nhập"
            name="username"
            autocomplete="username"
            hint="Độ dài từ 6 đến 12, chỉ bao gồm a-z, A-Z, và 0-9"
            required
            outlined
            @input="clearLoginErrorMessage"
            :readonly="isLoadingLogin"
          ></v-text-field>
        </v-col>

        <v-col cols="12" class="py-0">
          <v-text-field
            v-model="password"
            :rules="rules"
            label="Mật khẩu"
            name="password"
            autocomplete="current-password"
            hint="Độ dài từ 6 đến 12, chỉ bao gồm a-z, A-Z, và 0-9"
            :type="showPassword ? 'text' : 'password'"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append="showPassword = !showPassword"
            outlined
            @input="clearLoginErrorMessage"
            :readonly="isLoadingLogin"
          ></v-text-field>
        </v-col>

        <v-col cols="12" class="py-0">
          <v-checkbox
            v-model="rememberMe"
            label="Nhớ thông tin đăng nhập (Không bảo mật)"
            class="mt-0"
          ></v-checkbox>
        </v-col>
      </v-row>
    </v-form>

    <v-alert dense outlined type="error" v-if="loginErrorMessage">
      {{ loginErrorMessage }}
    </v-alert>

    <div class="mt-5">
      <v-btn block color="primary" @click="login" :disabled="isLoadingLogin">
        <v-progress-circular
          color="primary"
          indeterminate
          class="mr-2"
          style="height: 20px"
          v-if="isLoadingLogin"
        ></v-progress-circular>
        Đăng nhập
      </v-btn>
    </div>

    <div class="text-center text-body-2 mt-2">
      Chưa có tài khoản?
      <router-link
        to="/auth/register"
        class="text-decoration-none text-primary font-weight-medium"
      >
        Đăng ký
      </router-link>
    </div>
  </v-sheet>
</template>

<script lang="ts">
import Vue from "vue";

import { authApi } from "@/api/auth";

const isDev = process.env.NODE_ENV == "development";
export default Vue.extend({
  data() {
    return {
      showPassword: false,
      valid: false,
      username: isDev
        ? "qlgp1234"
        : localStorage.getItem("QLGP.username") || "",
      password: isDev
        ? "qlgp1234"
        : localStorage.getItem("QLGP.password") || "",
      rememberMe: !!(
        localStorage.getItem("QLGP.username") &&
        localStorage.getItem("QLGP.password")
      ),
      rules: [
        (v: string) => !!v || "Không được để trống",
        (v: string) =>
          (6 <= v.length && v.length <= 12) || "Độ dài phải từ 6 đến 12 ký tự",
        (v: string) =>
          /^[a-zA-Z0-9]+$/.test(v) || "Chỉ được chứa a-z, A-Z và 0-9",
      ],
      loginErrorMessage: "",
      isLoadingLogin: false,
    };
  },
  methods: {
    clearLoginErrorMessage() {
      this.loginErrorMessage = "";
    },
    async login() {
      /* eslint-disable-line */ // @ts-ignore
      const valid = this.$refs.form.validate();
      if (!valid) return;

      this.clearLoginErrorMessage();

      this.isLoadingLogin = true;
      const { data, status } = await authApi.login({
        username: this.username,
        password: this.password,
      });
      this.isLoadingLogin = false;

      if (status == 0) {
        this.loginErrorMessage = "Không thể kết nối tới Server";
        return;
      }
      if (status > 299) {
        this.loginErrorMessage = data.msg || "";
        return;
      }

      if (this.rememberMe) {
        localStorage.setItem("QLGP.username", this.username);
        localStorage.setItem("QLGP.password", this.password);
      } else {
        localStorage.removeItem("QLGP.username");
        localStorage.removeItem("QLGP.password");
      }

      const search = window.location.search;
      const params = new URLSearchParams(search);

      this.$router.push(params.get("next") || "/");
    },
  },
});
</script>
