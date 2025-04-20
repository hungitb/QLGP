<template>
  <div>
    <v-row>
      <v-col cols="12" lg="4">
        <v-card :loading="loadingAddShare">
          <v-card-title style="word-break: initial"
            >Tạo tài khoản cho người thân sử dụng</v-card-title
          >
          <v-card-text>
            <v-form ref="form" class="mt-5">
              <v-text-field
                v-model="newUserUsername"
                label="Tên đăng nhập"
                :disabled="loadingAddShare"
                :rules="usernamePasswordRules"
                outlined
                append-icon="mdi-dice-6-outline"
                @click:append="radomUsername"
                validate-on-blur
              ></v-text-field>

              <v-text-field
                v-model="newUserPassword"
                label="Mật khẩu"
                :disabled="loadingAddShare"
                :rules="usernamePasswordRules"
                hint="Mật khẩu tạm thời, sau này người sử dụng có thể tự đổi lại"
                outlined
                append-icon="mdi-dice-6-outline"
                @click:append="radomPassword"
                validate-on-blur
              ></v-text-field>

              <v-text-field
                v-model="newUserNote"
                label="Ghi chú"
                :disabled="loadingAddShare"
                outlined
              ></v-text-field>

              <div>Quyền</div>
              <v-radio-group
                v-model="newUserPermission"
                :disabled="loadingAddShare"
              >
                <v-radio label="Chỉ xem" value="read"></v-radio>
                <v-radio label="Xem và chỉnh sửa" value="write"></v-radio>
              </v-radio-group>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-btn
              class="ml-2 mb-2"
              outlined
              color="primary"
              @click="addShare"
              :disabled="loadingAddShare"
              >Tạo tài khoản</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" lg="8">
        <v-card>
          <v-card-title>Những tài khoản đã tạo</v-card-title>
          <v-card-text>
            <v-data-table
              :items="sharedUsers"
              :loading="loadingSharedUsers"
              :headers="sharedTableHeaders"
            >
              <template v-slot:item.permission="{ item, value }">
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

              <template v-slot:item.createdAt="{ value }">
                {{ userFriendlyDateFormat(value) }}
              </template>

              <template v-slot:item.actions="{ item }">
                <v-icon class="mr-4" @click.stop="showEditShareDialog(item)">
                  mdi-pencil
                </v-icon>

                <v-icon color="error" @click.stop="deleteShare(item)">
                  mdi-delete
                </v-icon>
              </template>
            </v-data-table>

            <CustomDialog
              v-if="editShareDialogTarget"
              v-model="editShareDialog"
              max-width="500"
              header="Chỉnh sửa tài khoản"
              buttonText
              persistent
              :buttons="[
                {
                  text: 'Lưu',
                  click: saveEditShare,
                },
              ]"
            >
              <v-text-field
                :value="editShareDialogTarget.username"
                label="Tên đăng nhập"
                outlined
                disabled
              ></v-text-field>
              <v-text-field
                v-model="editShareDialogNote"
                label="Ghi chú"
                outlined
              ></v-text-field>
            </CustomDialog>
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
import { SharedUserInfo } from "../../../../backend/src/controller/share";
import { usernamePasswordRules } from "../../../../backend/src/controller/utils";
import CustomDialog from "@/components/CustomDialog.vue";
import { userFriendlyDateFormat } from "../../../../backend/src/utils/DateUtils";

export default defineComponent({
  mixins: [permissionMixin],
  components: {
    CustomDialog,
  },
  data() {
    return {
      userFriendlyDateFormat,

      usernamePasswordRules,
      newUserUsername: "",
      newUserPassword: "",
      newUserNote: "",
      newUserPermission: "read" as "read" | "write",
      loadingAddShare: false,

      loadingSharedUsers: true,
      sharedTableHeaders: [
        { text: "Tên đăng nhập", value: "username" },
        { text: "Quyền", value: "permission" },
        { text: "Ghi chú", value: "note" },
        { text: "Ngày tạo", value: "createdAt" },
        { text: "", value: "actions", sortable: false },
      ],
      sharedUsers: [] as SharedUserInfo[],
      editShareDialog: false,
      editShareDialogTarget: null as SharedUserInfo | null,
      editShareDialogNote: "",
    };
  },
  methods: {
    randInt() {
      return Math.round(1000 + Math.random() * 9000);
    },
    radomUsername() {
      this.newUserUsername = `qlgp${this.randInt()}`;
    },
    radomPassword() {
      this.newUserPassword = `pass${this.randInt()}`;
    },
    async saveEditShare() {
      this.editShareDialog = false;
      if (!this.editShareDialogTarget) return;

      this.loadingSharedUsers = true;
      const { status } = await shareApi.updateShare({
        userId: this.editShareDialogTarget.id,
        note: this.editShareDialogNote,
      });
      this.loadingSharedUsers = false;

      if (status == 0 || status >= 400) {
        showSnackbar({
          msg: "Có lỗi xảy ra",
          type: "error",
        });
      } else {
        const targetIndex = this.sharedUsers.findIndex(
          (u) => u.id == this.editShareDialogTarget!.id
        );
        if (targetIndex != -1) {
          this.sharedUsers[targetIndex].note = this.editShareDialogNote;
        }
      }
    },
    async onPermChange(target: SharedUserInfo, perm: "write" | "read") {
      this.loadingSharedUsers = true;
      perm = perm == "write" ? "write" : "read";

      const { status } = await shareApi.updateShare({
        userId: target.id,
        permission: perm,
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
          this.sharedUsers[targetIndex].permission = perm;
        }
      }

      this.loadingSharedUsers = false;
    },
    showEditShareDialog(target: SharedUserInfo) {
      this.editShareDialogTarget = target;
      this.editShareDialogNote = target.note;
      this.editShareDialog = true;
    },
    async deleteShare(target: SharedUserInfo) {
      showDialogConfirm({
        header: `Bạn có chắc chắn muốn xóa tài khoản này không?`,
        info: `Tài khoản ${target.username} sẽ không còn quyền truy cập vào gia phả nữa`,
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
      const { data } = await shareApi.shared({});
      if ("users" in data) {
        this.sharedUsers = data.users;
      }
      this.loadingSharedUsers = false;
    },
    async addShare() {
      const valid = (this.$refs.form as any).validate();
      if (!valid) return;

      this.loadingAddShare = true;

      const { data, status } = await shareApi.addShare({
        username: this.newUserUsername,
        password: this.newUserPassword,
        note: this.newUserNote,
        perm: this.newUserPermission,
      });
      this.loadingAddShare = false;

      if (status >= 400 || "msg" in data) {
        const msg = "msg" in data ? data.msg : "Có lỗi xảy ra";
        showSnackbar({
          msg,
          type: "error",
        });
        return;
      }

      showSnackbar({ msg: `Tạo tài khoản ${this.newUserUsername} thành công` });
      this.loadSharedUsers();
      this.newUserUsername = "";
      this.newUserPassword = "";
      this.newUserNote = "";
      this.newUserPermission = "read";
    },
  },
  beforeMount() {
    if (!this.isAdmin()) {
      this.$router.push("/");
    }
  },
  mounted() {
    this.loadSharedUsers();
  },
});
</script>
