<template>
  <v-container>
    <div>
      <div class="py-2">
        <AddPersonDialog>
          <template v-slot:activator="{ attrs, on }">
            <v-btn v-bind:attrs="attrs" v-on="on">
              <v-icon left>mdi-account-plus</v-icon> Thêm người thân
            </v-btn>
          </template>
        </AddPersonDialog>
      </div>
      <v-data-table
        :headers="headers"
        :items="people"
        item-key="id"
        class="elevation-1"
        :options.sync="peopleListOption"
        :server-items-length="totalPeople"
      >
        <template v-slot:top>
          <v-text-field
            v-model="search"
            label="Tìm kiếm"
            class="mx-4"
          ></v-text-field>
        </template>

        <template v-slot:item.avatarUrl="{ item, isMobile }">
          <div :class="!isMobile ? 'pa-2' : 'pt-2'">
            <CustomPersonAvatar size="40" :person="item" textSize="5" />
          </div>
        </template>

        <template v-slot:item.gender="{ value }">
          {{ value != Gender.MALE ? "Nữ" : "Nam" }}
        </template>

        <template
          v-slot:header.birthday="{ header }"
          v-if="!peopleTableInMobileLayout"
        >
          <span style="display: inline-block; text-align: end; width: 72px">{{
            header.text
          }}</span>
        </template>

        <template v-slot:item.status_deathday="{ value }">
          <span
            :style="{ color: value[0] == LifeStatus.DEAD ? 'red' : 'green' }"
          >
            {{
              !value[0]
                ? ""
                : value[0] == LifeStatus.ALIVE
                ? "Còn sống"
                : "Đã mất"
            }}
          </span>
          <span
            v-if="value[0] == LifeStatus.DEAD && value[1]"
            style="color: blue"
            >|</span
          >
          {{ value[1] }}
        </template>
      </v-data-table>
    </div></v-container
  >
</template>

<script lang="ts">
import Vue from "vue";

import { Gender, LifeStatus, type Person } from "../../../general/model/Person";
import { personApi } from "@/api/person";
import { transformDateString } from "../../../general/utils/DateUtils";
import AddPersonDialog from "@/components/AddPersonDialog.vue";
import CustomPersonAvatar from "@/components/CustomPersonAvatar.vue";

export default Vue.extend({
  components: {
    AddPersonDialog,
    CustomPersonAvatar,
  },
  data: function () {
    return {
      search: "",
      totalPeople: 0,
      people: [] as Partial<Person>[],
      loadingPeople: true,
      peopleListOption: {} as Record<string, any>,
      Gender,
      LifeStatus,
      headers: [
        {
          text: "",
          sortable: false,
          value: "avatarUrl",
          align: "end",
        },
        {
          text: "Tên gọi",
          value: "callname",
        },
        {
          text: "Giới tính",
          value: "gender",
        },
        {
          text: "Ngày sinh",
          value: "birthday",
        },
        {
          text: "Tình trạng",
          value: "status_deathday",
        },
      ],
    };
  },
  computed: {
    peopleTableInMobileLayout() {
      return this.$vuetify.breakpoint.width < 600; // 600: default mobile-breakpoint of v-data-table
    },
  },
  methods: {
    fetchPeopleFromServer() {
      this.loadingPeople = true;

      const { sortBy, sortDesc, page, itemsPerPage } = this.peopleListOption;

      personApi
        .getAllPeopleBaseInfo({
          page,
          itemsPerPage,
          sortBy: sortBy[0],
          sortDesc: sortDesc[0],
          search: this.search,
        })
        .then(({ data, status }) => {
          this.loadingPeople = false;
          if (data.people) {
            this.people = data.people.map(
              ({
                callname,
                gender,
                avatarUrl,
                birthday,
                deathday,
                status,
              }) => ({
                callname,
                gender,
                avatarUrl,
                birthday,
                status_deathday: [
                  status || "",
                  deathday
                    ? transformDateString(deathday, {
                        showNormalDate: !this.peopleTableInMobileLayout,
                        showLunarDate: !this.peopleTableInMobileLayout,
                      })
                    : "",
                ],
              })
            );
          }
          if (data.total) {
            this.totalPeople = data.total;
          }
        });
    },
  },
  watch: {
    peopleListOption: {
      handler() {
        this.fetchPeopleFromServer();
      },
      deep: true,
    },
    search: {
      handler() {
        this.peopleListOption.page = 1;
        this.fetchPeopleFromServer();
      },
    },
  },
  mounted() {
    this.fetchPeopleFromServer();
  },
});
</script>
