<template>
  <div>
    <v-row>
      <v-col cols="12" md="6">
        <v-card :loading="loadingAddShare">
          <v-card-title>Thêm người chia sẻ</v-card-title>
          <v-card-text>
            <v-autocomplete
              v-model="choosedUsername"
              :loading="isLoadingItems"
              :items="items"
              :search-input.sync="search"
              hide-no-data
              :disabled="loadingAddShare"
              :hint="
                seachLengthEnough ? undefined : 'Ít nhất 4 ký tự để xem gợi ý'
              "
              outlined
              label="Tên người dùng"
            ></v-autocomplete>

            <div>Quyền</div>
            <v-radio-group
              v-model="newUserPermission"
              :disabled="loadingAddShare"
            >
              <v-radio label="Chỉ xem" value="read"></v-radio>
              <v-radio label="Xem và chỉnh sửa" value="write"></v-radio>
            </v-radio-group>
          </v-card-text>

          <v-card-actions>
            <v-btn
              class="ml-2 mb-2"
              outlined
              color="primary"
              @click="addShare"
              :disabled="loadingAddShare"
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
            >
              <template v-slot:item.perm="{ item, value }">
                <div style="width: 160px">
                  <v-select
                    :items="[
                      { text: 'Chỉ xem', value: 'read' },
                      { text: 'Xem và sửa', value: 'write' },
                    ]"
                    :value="value"
                    @change="(v) => onPermChange(item, v)"
                    dense
                    outlined
                    hide-details
                  ></v-select>
                </div>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-icon color="error" @click.stop="deleteShare(item)">
                  mdi-delete
                </v-icon>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { shareApi } from "@/api/share";
import { User } from "../../../../backend/src/model/User";
import { showSnackbar } from "@/components/utilities/ShowSnackbar.vue";
import { showDialogConfirm } from "@/components/utilities";
import { permissionMixin } from "@/utils";

export default defineComponent({
  mixins: [permissionMixin],
  data() {
    return {
      search: "",
      choosedUsername: null as string | null,
      items: [] as string[],
      isLoadingItems: false,
      newUserPermission: "read" as "read" | "write",
      loadingAddShare: false,

      loadingSharedUsers: true,
      sharedTableHeaders: [
        { text: "Người dùng", value: "username", sortable: false },
        { text: "Quyền", value: "perm", sortable: false },
        { text: "", value: "actions", sortable: false },
      ],
      sharedUsers: [] as (User & { perm: "read" | "write" })[],
    };
  },
  computed: {
    seachLengthEnough() {
      const search = (this as any).search as string;
      if (!search) return false;
      return search.length >= 4;
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
    async onPermChange(target: User, perm: "write" | "read") {
      this.loadingSharedUsers = true;
      perm = perm == "write" ? "write" : "read";

      const { status } = await shareApi.changePerm({
        userId: target.id,
        perm,
      });

      if (status == 0 || status >= 400) {
        showSnackbar({
          msg: "Có lỗi xảy ra",
          type: "error",
        });
      } else {
        const targetIndex = this.sharedUsers.findIndex(
          (u) => u.id == target.id
        );
        if (targetIndex != -1) {
          this.sharedUsers[targetIndex].perm = perm;
        }
      }

      this.loadingSharedUsers = false;
    },
    async deleteShare(target: User) {
      showDialogConfirm({
        header: `Bạn có chắc chắn muốn hủy chia sẻ không?`,
        info: `Không chia sẻ cho ${target.username} nữa`,
        confirmText: "Chắc chắn",
        confirmColor: "red",
        notAwaitOnConfirmed: true,
        onConfirmed: async () => {
          this.loadingSharedUsers = true;

          const { status } = await shareApi.deleteShare({ userId: target.id });

          if (status == 0 || status >= 400) {
            showSnackbar({
              msg: "Có lỗi xảy ra",
              type: "error",
            });
          } else {
            const targetIndex = this.sharedUsers.findIndex(
              (u) => u.id == target.id
            );
            if (targetIndex != -1) {
              this.sharedUsers.splice(targetIndex, 1);
            }
          }

          this.loadingSharedUsers = false;
        },
      });
    },
    async loadSharedUsers() {
      this.loadingSharedUsers = true;
      const { data } = await shareApi.shared();
      if (data.users) {
        this.sharedUsers = data.users;
      }
      this.loadingSharedUsers = false;
    },
    async addShare() {
      if (!this.choosedUsername) return;

      this.loadingAddShare = true;

      const { data, status } = await shareApi.addShare({
        username: this.choosedUsername,
        perm: this.newUserPermission,
      });
      this.loadingAddShare = false;

      if (status >= 400) {
        const msg = data.msg || "Có lỗi xảy ra";
        showSnackbar({
          msg,
          type: "error",
        });
        return;
      }

      showSnackbar({ msg: `Chia sẻ cho ${this.choosedUsername} thành công` });
      this.loadSharedUsers();
      this.choosedUsername = null;
    },
  },
  beforeMount() {
    if (!this.ownGraph()) {
      this.$router.push("/");
    }
  },
  mounted() {
    this.loadSharedUsers();
  },
});
</script>
