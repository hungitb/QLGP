<template>
  <v-sheet>
    <v-img
      :src="require('@/assets/logo.png')"
      class="mb-8 mx-auto"
      style="width: 160px"
      eager
    />
    <div class="text-h5 text-center font-weight-medium mb-8">
      Đăng ký tài khoản
    </div>
    <v-form v-model="valid" ref="form">
      <v-text-field
        v-model="username"
        :rules="rules"
        label="Tên đăng nhập"
        name="username"
        autocomplete="username"
        hint="Độ dài từ 6 đến 12, chỉ bao gồm a-z, A-Z, và 0-9"
        required
        outlined
        @input="clearRegisterErrorMessage"
        :readonly="isLoadingRegister"
      ></v-text-field>

      <v-text-field
        v-model="password"
        :rules="rules"
        label="Mật khẩu"
        name="password"
        autocomplete="new-password"
        hint="Độ dài từ 6 đến 12, chỉ bao gồm a-z, A-Z, và 0-9"
        :type="showPassword ? 'text' : 'password'"
        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        @click:append="showPassword = !showPassword"
        outlined
        @input="clearRegisterErrorMessage"
        :readonly="isLoadingRegister"
      ></v-text-field>

      <v-text-field
        v-model="password2"
        :rules="[...rules, testForPassword2]"
        label="Nhập lại mật khẩu"
        name="confirm-password"
        autocomplete="new-password"
        :type="showPassword2 ? 'text' : 'password'"
        :append-icon="showPassword2 ? 'mdi-eye' : 'mdi-eye-off'"
        @click:append="showPassword2 = !showPassword2"
        outlined
        @input="clearRegisterErrorMessage"
        :readonly="isLoadingRegister"
      ></v-text-field>

      <v-checkbox
        v-model="ownGraph"
        label="Quản lý gia phả của riêng bạn"
        persistent-hint
        class="mt-0"
        :hint="
          ownGraph
            ? 'Bạn có toàn quyền quản lý gia phả của mình'
            : 'Bạn sẽ chỉ có thể tham gia vào gia phả của người khác'
        "
      ></v-checkbox>

      <div v-if="ownGraph" class="mt-4 pl-6">
        <div class="text-subtitle">Người đứng đầu gia phả</div>
        <div class="text-caption grey--text mb-3">
          Bạn có thể thay đổi sau này
        </div>

        <v-text-field
          v-model="fullname"
          :rules="rulesFullname"
          label="Họ tên"
          name="fullname"
          autocomplete="fullname"
          required
          outlined
          @input="clearRegisterErrorMessage"
          :readonly="isLoadingRegister"
        ></v-text-field>

        <v-select
          v-model="gender"
          :items="[Gender.MALE, Gender.FEMALE]"
          label="Giới tính"
          outlined
          @input="clearRegisterErrorMessage"
          :readonly="isLoadingRegister"
        ></v-select>
      </div>
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
import { Gender } from "../../../backend/src/model/Person";

const isDev = process.env.NODE_ENV == "development";
export default Vue.extend({
  data: () => ({
    Gender,
    showPassword: false,
    showPassword2: false,
    valid: false,
    fullname: isDev ? "Nguyễn Văn Hùng" : "",
    gender: Gender.MALE,
    username: isDev ? "qlgp1234" : "",
    password: isDev ? "qlgp1234" : "",
    password2: isDev ? "qlgp1234" : "",
    ownGraph: true,
    rulesFullname: [(v: string) => !!v || "Không được để trống"],
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
      const { data, status } = await authApi.register({
        fullname: this.fullname,
        gender: this.gender,
        username: this.username,
        password: this.password,
        ownGraph: this.ownGraph,
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

      const loginRespone = await authApi.login({
        username: this.username,
        password: this.password,
      });

      if (loginRespone.status == 0 || loginRespone.status > 299) {
        this.$router.push("/auth/login");
        return;
      }

      this.$router.push("/");
    },
  },
});
</script>
