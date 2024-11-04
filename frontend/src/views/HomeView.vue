<template>
  <v-container>
    <div>
      <v-data-table
        :headers="headers"
        :items="people"
        item-key="id"
        class="elevation-1"
        :search="search"
        :options.sync="peopleListOption"
        :custom-filter="personFilter"
        :server-items-length="totalPeople"
      >
        <template v-slot:item.avatarUrl="{ item, isMobile }">
          <div :class="!isMobile ? 'pa-2' : 'pt-2'">
            <v-avatar
              size="40"
              :color="item.gender != Gender.MALE ? 'pink' : 'primary'"
            >
              <img
                :src="item.avatarUrl"
                :alt="item.callname"
                v-if="item.avatarUrl"
              />
              <v-icon dark v-else>
                {{
                  item.gender != Gender.MALE
                    ? "mdi-account-tie-woman"
                    : "mdi-account-tie"
                }}
              </v-icon>
            </v-avatar>
          </div>
        </template>

        <template v-slot:item.gender="{ value }">
          {{ value != Gender.MALE ? "Nữ" : "Nam" }}
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
          {{ value[0] && value[1] && "-" }}
          {{ value[1] }}
        </template>

        <template v-slot:top>
          <v-text-field
            v-model="search"
            label="Tìm kiếm"
            class="mx-4"
          ></v-text-field>
        </template>
      </v-data-table></div
  ></v-container>
</template>

<script lang="ts">
import Vue from "vue";

import { Gender, LifeStatus, type Person } from "../../../general/model/Person";
import { personApi } from "@/api/person";

export default Vue.extend({
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
  methods: {
    personFilter(value: string, search: string, item: any) {
      return (
        value != null &&
        search != null &&
        typeof value === "string" &&
        value.toString().toLocaleUpperCase().indexOf(search) !== -1
      );
    },
    fetchPeopleFromServer() {
      this.loadingPeople = true;

      const { sortBy, sortDesc, page, itemsPerPage } = this.peopleListOption;

      personApi
        .getAllPeopleBaseInfo({
          page,
          itemsPerPage,
          sortBy: sortBy[0],
          sortDesc: sortDesc[0],
        })
        .then(({ data, status }) => {
          this.loadingPeople = false;
          console.log(
            {
              page,
              itemsPerPage,
              sortBy: sortBy[0],
              sortDesc: sortDesc[0],
            },
            data.people
          );
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
                status_deathday: [status || "", deathday || ""],
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
  },
  mounted() {
    this.fetchPeopleFromServer();
  },
});
</script>
