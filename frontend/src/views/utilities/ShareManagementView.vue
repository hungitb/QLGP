<template>
  <div>
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Thêm người chia sẻ</v-card-title>
          <v-card-text>
            <v-autocomplete
              v-model="choosedUsername"
              :loading="isLoadingItems"
              :items="items"
              :search-input.sync="search"
              hide-no-data
              :hint="
                seachLengthEnough ? undefined : 'Ít nhất 4 ký tự để xem gợi ý'
              "
              outlined
              label="Nhập tên người dùng muốn chia sẻ"
            ></v-autocomplete>

            <p>Quyền</p>
            <v-radio-group v-model="newUserPermission">
              <v-radio label="Chỉ xem" value="read"></v-radio>
              <v-radio label="Xem và chỉnh sửa" value="write"></v-radio>
            </v-radio-group>
          </v-card-text>

          <v-card-actions>
            <v-btn class="ml-2 mb-2" outlined color="primary" @click="addShare"
              >Chia sẻ</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Những người đã được chia sẻ</v-card-title>
          <v-card-text>
            <v-data-table
              :items="sharedUsers"
              :loading="loadingSharedUsers"
              :headers="sharedTableHeaders"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { exportData } from "../../../../backend/src/DAO/fake/FakeDAO";
import { todayDate } from "../../../../backend/src/utils/DateUtils";
import { shareApi } from "@/api/share";
import { User } from "../../../../backend/src/model/User";

export default defineComponent({
  data() {
    return {
      search: "",
      choosedUsername: "",
      items: [] as string[],
      isLoadingItems: false,
      newUserPermission: "read" as "read" | "write",

      loadingSharedUsers: true,
      sharedTableHeaders: [
        { text: "Người dùng", value: "username", sortable: false },
        { text: "Quyền", value: "perm", sortable: false },
      ],
      sharedUsers: [] as (User & { perm: "read" | "write" })[],
    };
  },
  computed: {
    seachLengthEnough() {
      if (!this.search) return false;
      return this.search.length >= 4;
    },
  },
  watch: {
    async search(v) {
      if (!this.seachLengthEnough) {
        this.isLoadingItems = false;
        this.items = [];
        return;
      }

      this.isLoadingItems = true;
      this.items = [];
      const { data } = await shareApi.searchUser({ username: v });
      if (data.usernames) {
        this.items = data.usernames;
      }

      this.isLoadingItems = false;
    },
  },
  methods: {
    async loadSharedUsers() {
      this.loadingSharedUsers = true;
      const { data } = await shareApi.shared();
      if (data.users) {
        this.sharedUsers = data.users;
      }
      this.loadingSharedUsers = false;
    },
    addShare() {
      //
    },
  },
  mounted() {
    this.loadSharedUsers();
  },
});
</script>
