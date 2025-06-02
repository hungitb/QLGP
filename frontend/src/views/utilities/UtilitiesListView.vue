<template>
  <v-container>
    <v-list
      v-if="$route.path == '/utilities'"
      :three-line="$vuetify.breakpoint.xsOnly"
    >
      <v-list-item
        v-for="item in items"
        :key="item.title"
        @click="$router.push(item.url)"
        class="rounded-lg"
        style="overflow: hidden"
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
      <v-btn class="mb-8 mt-2" @click="$router.go(-1)" outlined color="primary">
        <v-icon left>mdi-arrow-left-thick</v-icon>
        Quay lại
      </v-btn>
      <router-view></router-view>
    </template>
  </v-container>
</template>

<script lang="ts">
import { permissionMixin } from "@/utils";
import { defineComponent } from "vue";

const buildStatic = process.env.QLGP_USE_BACKEND != "true";

export default defineComponent({
  mixins: [permissionMixin],
  data() {
    return {
      items: [
        {
          icon: "mdi-chart-box-outline",
          title: "Thống kê",
          subtitle:
            "Xem các thông tin thống kê về các thành viên trong gia phả",
          url: "/utilities/statistic",
        },
        {
          icon: "mdi-account-switch",
          title: "Phân tích mối quan hệ",
          subtitle: "Phân tích mối quan hệ giữa các thành viên",
          url: "/utilities/relationship_analysis",
        },
        // {
        //   icon: "mdi-calendar-month",
        //   title: "Lịch âm",
        //   subtitle: "Xem lịch âm các tháng, các năm",
        //   url: "/utilities/lunar_calendar",
        // },
        ...(buildStatic
          ? [
              {
                icon: "mdi-content-save",
                title: "Sao lưu dữ liệu",
                subtitle: "Tạo dữ liệu sao lưu để di chuyển sang thiết bị khác",
                url: "/utilities/backup",
              },
            ]
          : []),
        ...(this.isAdmin()
          ? [
              {
                icon: "mdi-share-variant",
                title: "Chia sẻ gia phả",
                subtitle:
                  "Cho phép người khác có thể tham gia, xem, hoặc sửa thông tin gia phả của bạn",
                url: "/utilities/share_management",
              },
            ]
          : []),
      ],
    };
  },
});
</script>
