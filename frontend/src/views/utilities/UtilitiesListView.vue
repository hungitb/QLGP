<template>
  <v-container>
    <v-list v-if="$route.path == '/utilities'">
      <v-list-item
        v-for="item in items"
        :key="item.title"
        @click="$router.push(item.url)"
      >
        <v-list-item-icon>
          <v-icon>
            {{ item.icon }}
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ item.title }}</v-list-item-title>

          <v-list-item-subtitle>
            {{ item.subtitle }}
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-icon>
          <v-icon>mdi-chevron-right</v-icon>
        </v-list-item-icon>
      </v-list-item>
    </v-list>
    <template v-else>
      <v-btn class="mb-4" @click="$router.go(-1)" outlined color="primary">
        <v-icon left>mdi-chevron-left</v-icon>
        Quay lại
      </v-btn>
      <router-view></router-view>
    </template>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      items: [
        {
          icon: "mdi-chart-box-outline",
          title: "Thống kê",
          subtitle: "Xem các thông tin thống kê về những người thân của bạn",
          url: "/utilities/statistic",
        },
        {
          icon: "mdi-content-save",
          title: "Sao lưu dữ liệu",
          subtitle: "Tạo dữ liệu sao lưu để di chuyển sang thiết bị khác",
          url: "/utilities/backup",
        },
      ],
    };
  },
});
</script>
