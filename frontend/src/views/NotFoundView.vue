<template>
  <v-app>
    <v-container fluid fill-height>
      <v-layout align-center justify-center>
        <div style="width: 400px">
          <v-sheet>
            <v-img
              :src="require('@/assets/logo.png')"
              class="mb-8 mx-auto"
              style="width: 160px"
              eager
            />
            <div class="text-h5 text-center font-weight-medium mb-8">
              Không tìm thấy trang!
            </div>
            <div class="text-center text-body-2 mt-2">
              Có phải bạn đang tìm
              <router-link
                to="/"
                class="text-decoration-none text-primary font-weight-medium"
              >
                Trang chủ
              </router-link>
            </div>
          </v-sheet>
        </div>
      </v-layout>
    </v-container>
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({});
</script>
