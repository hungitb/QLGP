<template>
  <v-card>
    <v-card-title>Thông tin gia phả</v-card-title>
    <v-card-text>
      <v-simple-table>
        <tbody>
          <tr>
            <th :style="firstHeaderElementStyle">Tên dòng họ</th>
            <td>{{ thongTinGiaPha.tenDongHo || "Chưa đặt" }}</td>
          </tr>
          <tr>
            <th>Tổ tiên</th>
            <td>
              <div v-if="thongTinGiaPha.idToTien" class="d-flex align-center">
                <v-skeleton-loader
                  v-if="$store.state.isLoadingPeople"
                  type="text"
                  width="40"
                ></v-skeleton-loader>
                <template v-else>
                  <CustomPersonAvatar
                    :person="
                      $store.state.personMapping[thongTinGiaPha.idToTien]
                    "
                    size="30"
                  />
                  <span class="ml-3">{{
                    $store.state.personMapping[thongTinGiaPha.idToTien].callname
                  }}</span>
                </template>
              </div>
              <template v-else>Chưa đặt</template>
            </td>
          </tr>
          <tr>
            <th>Chế độ</th>
            <td>{{ cheDoGiaPhaTextMapping[thongTinGiaPha.type] }}</td>
          </tr>
          <tr v-if="thongTinGiaPha.thongTinKhac?.trim()">
            <th>Thông tin khác</th>
            <td>
              <div
                v-for="(line, i) in thongTinGiaPha.thongTinKhac.split('\n')"
                :key="i"
              >
                {{ line }}
              </div>
            </td>
          </tr>
        </tbody>
      </v-simple-table>
    </v-card-text>
    <v-card-actions v-if="canWrite()">
      <v-btn text color="primary" @click="dialogEdit = true">Chỉnh sửa</v-btn>
    </v-card-actions>

    <CustomDialog
      v-model="dialogEdit"
      header="Sửa thông tin gia phả"
      maxWidth="500"
      buttonText
      :isLoading="loading"
      :buttons="[{ click: updateThongTinGiaPha, text: 'Lưu' }]"
      xsFullScreen
      persistent
    >
      <v-text-field
        v-model="newTenDongHo"
        outlined
        label="Tên dòng họ"
      ></v-text-field>
      <PersonInputGroup
        v-model="newIdToTien"
        label="Tổ tiên"
        one
      ></PersonInputGroup>
      <v-select
        v-model="newCheDo"
        outlined
        :items="cheDoGiaPhaItems"
        label="Chế độ"
      ></v-select>
      <v-textarea
        v-model="newThongTinKhac"
        outlined
        label="Thông tin khác"
      ></v-textarea>
    </CustomDialog>
  </v-card>
</template>

<script lang="ts">
import { permissionMixin } from "@/utils";
import { defineComponent } from "vue";
import CustomDialog from "./CustomDialog.vue";
import PersonInputGroup from "./input/PersonInputGroup.vue";
import {
  CheDoGiaPha,
  ThongTinGiaPha,
} from "../../../backend/src/model/ThongTinGiaPha";
import { personApi } from "@/api/person";
import CustomPersonAvatar from "./CustomPersonAvatar.vue";
import store from "@/store";
import { Person } from "../../../backend/src/model/Person";

const cheDoGiaPhaTextMapping: Record<CheDoGiaPha, string> = {
  phaHe: "Phả hệ",
  mauHe: "Mẫu hệ",
};

export default defineComponent({
  mixins: [permissionMixin],
  components: {
    CustomDialog,
    PersonInputGroup,
    CustomPersonAvatar,
  },
  data() {
    const cheDoGiaPhas: CheDoGiaPha[] = ["phaHe", "mauHe"];

    return {
      loading: false,
      dialogEdit: false,
      newTenDongHo: null as string | null,
      newSoDoiCuaToTien: 1,
      newIdToTien: null as string | null,
      newCheDo: "phaHe" as "mauHe" | "phaHe",
      newThongTinKhac: "",
      cheDoGiaPhaTextMapping,
      cheDoGiaPhaItems: cheDoGiaPhas.map((c) => ({
        text: cheDoGiaPhaTextMapping[c],
        value: c,
      })),
    };
  },
  computed: {
    thongTinGiaPha() {
      return ((this as any).$store as typeof store).state.user.thongTinGiaPha;
    },
    firstHeaderElementStyle() {
      if (this.$vuetify.breakpoint.xs) return {};
      return { width: "140px" };
    },
  },
  watch: {
    dialogEdit(v) {
      if (v) {
        this.loading = false;
        this.newTenDongHo = this.thongTinGiaPha.tenDongHo;
        this.newSoDoiCuaToTien = this.thongTinGiaPha.soDoiCuaToTien;
        this.newIdToTien = this.thongTinGiaPha.idToTien;
        this.newCheDo = this.thongTinGiaPha.type;
        this.newThongTinKhac = this.thongTinGiaPha.thongTinKhac;
      }
    },
  },
  methods: {
    async updateThongTinGiaPha() {
      const data: Partial<ThongTinGiaPha> = {
        tenDongHo: this.newTenDongHo,
        soDoiCuaToTien: this.newSoDoiCuaToTien,
        idToTien: this.newIdToTien,
        type: this.newCheDo,
        // Text filed nếu rỗng trả về undefined
        thongTinKhac: this.newThongTinKhac ? this.newThongTinKhac.trim() : "",
      };

      this.loading = true;

      await personApi.updateThongTinGiaPha(data);

      this.$router.go(0);
    },
  },
});
</script>
