<template>
  <v-sheet>
    <v-img
      :src="require('@/assets/logo.png')"
      class="mb-8 mx-auto"
      style="width: 160px"
    />
    <div class="text-h5 text-center font-weight-medium mb-8">
      Đăng ký tài khoản
    </div>
    <v-form v-model="valid" ref="form">
      <v-row>
        <v-col cols="12" class="py-0">
          <v-text-field
            v-model="username"
            :rules="rules"
            label="Tên đăng nhập"
            hint="Độ dài từ 6 đến 12, chỉ bao gồm a-z, A-Z, và 0-9"
            required
            outlined
            @input="clearRegisterErrorMessage"
            :readonly="isLoadingRegister"
          ></v-text-field>
        </v-col>

        <v-col cols="12" class="py-0">
          <v-text-field
            v-model="password"
            :rules="rules"
            label="Mật khẩu"
            hint="Độ dài từ 6 đến 12, chỉ bao gồm a-z, A-Z, và 0-9"
            :type="showPassword ? 'text' : 'password'"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append="showPassword = !showPassword"
            outlined
            @input="clearRegisterErrorMessage"
            :readonly="isLoadingRegister"
          ></v-text-field>
        </v-col>

        <v-col cols="12" class="py-0">
          <v-text-field
            v-model="password2"
            :rules="[...rules, testForPassword2]"
            label="Nhập lại mật khẩu"
            :type="showPassword2 ? 'text' : 'password'"
            :append-icon="showPassword2 ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append="showPassword2 = !showPassword2"
            outlined
            @input="clearRegisterErrorMessage"
            :readonly="isLoadingRegister"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-form>

    <v-alert dense outlined type="error" v-if="registerErrorMessage">
      {{ registerErrorMessage }}
    </v-alert>

    <div class="mt-5">
      <v-btn
        block
        color="primary"
        @click="register"
        :disabled="isLoadingRegister"
      >
        <v-progress-circular
          color="primary"
          indeterminate
          class="mr-2"
          style="height: 20px"
          v-if="isLoadingRegister"
        ></v-progress-circular>
        Đăng ký
      </v-btn>
    </div>

    <div class="text-center text-body-2 mt-2">
      Đã có tài khoản?
      <router-link
        to="/auth/login"
        class="text-decoration-none text-primary font-weight-medium"
      >
        Đăng nhập
      </router-link>
    </div>
  </v-sheet>
</template>

<script lang="ts">
import Vue from "vue";

import { authApi } from "@/api/auth";

export default Vue.extend({
  data: () => ({
    showPassword: false,
    showPassword2: false,
    valid: false,
    username: "hungnv195",
    password: "hungnv195",
    password2: "hungnv195",
    rules: [
      (v: string) => !!v || "Không được để trống",
      (v: string) =>
        (6 <= v.length && v.length <= 12) || "Độ dài phải từ 6 đến 12 ký tự",
      (v: string) =>
        /^[a-zA-Z0-9]+$/.test(v) || "Chỉ được chứa a-z, A-Z và 0-9",
    ],
    registerErrorMessage: "",
    isLoadingRegister: false,
  }),
  methods: {
    testForPassword2(v: string) {
      for (const rule of this.rules) {
        const result = rule(this.password);
        if (typeof result == "string") {
          return true;
        }
      }
      if (v == this.password) {
        return true;
      }

      return "Không khớp với mật khẩu đã nhập";
    },
    clearRegisterErrorMessage() {
      this.registerErrorMessage = "";
    },
    async register() {
        /* eslint-disable-line */ // @ts-ignore 
      const valid = this.$refs.form.validate();
      if (!valid) return;

      this.clearRegisterErrorMessage();

      this.isLoadingRegister = true;
      const [data, status] = await authApi.register({
        username: this.username,
        password: this.password,
      });
      this.isLoadingRegister = false;

      if (status == 0) {
        this.registerErrorMessage = "Không thể kết nối tới Server";
        return;
      }
      if (status > 299) {
        this.registerErrorMessage = data.msg || "";
        return;
      }

      const [data2, status2] = await authApi.login({
        username: this.username,
        password: this.password,
      });

      if (status2 == 0 || status > 299) {
        this.$router.push("/auth/login");
        return;
      }

      this.$router.push("/");
    },
  },
});
</script>
