<template>
  <v-container>
    <div>
      <div class="py-2">
        <v-btn @click="showDialogAddOrCreatePerson">
          <v-icon left>mdi-account-plus</v-icon> Thêm người thân
        </v-btn>
      </div>
    </div>
    <v-card>
      <v-card-title>
        Danh sách người thân
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Tìm kiếm"
          single-line
          hide-details
        ></v-text-field>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="peopleList"
        :loading="$store.state.isLoadingPeople"
        :custom-sort="sortPeople"
        :page.sync="page"
        item-key="id"
        class="elevation-1"
      >
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
          <span style="display: inline-block; text-align: end; width: 80px">{{
            header.text
          }}</span>
        </template>

        <template
          v-slot:item.birthday="{ value }"
          v-if="!peopleTableInMobileLayout"
        >
          <span style="display: inline-block; text-align: end; width: 80px">{{
            value
          }}</span>
        </template>

        <template v-slot:item.status_deathday="{ item }">
          <template v-if="item.status == LifeStatus.ALIVE">
            <span style="color: green">Còn sống</span>
          </template>

          <template v-else-if="item.status == LifeStatus.DEAD">
            <span style="color: red">Đã mất</span>
            <template v-if="item.deathday">
              <span style="color: blue"> |</span>
              {{
                transformDateString(item.deathday, {
                  showNormalDate: !peopleTableInMobileLayout,
                  showLunarDate: !peopleTableInMobileLayout,
                })
              }}
            </template>
          </template>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-icon small class="mr-2" @click.stop="editPerson(item)">
            mdi-pencil
          </v-icon>

          <v-icon
            v-if="!item.isStandForUser"
            color="error"
            small
            @click.stop="deletePerson(item)"
          >
            mdi-delete
          </v-icon>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";

import { Gender, LifeStatus, Person } from "../../../general/model/Person";
import {
  compareTwoDateString,
  transformDateString,
} from "../../../general/utils/DateUtils";
import CustomPersonAvatar from "@/components/CustomPersonAvatar.vue";
import { filterPeople } from "../../../general/controller/person";
import { personApi } from "@/api/person";
import { mapActions } from "vuex";
import { FETCH_PEOPLE } from "@/store";
import {
  showDialogAddOrCreatePerson,
  showDialogConfirm,
} from "./Utilities.vue";

export default Vue.extend({
  components: {
    CustomPersonAvatar,
  },
  data: function () {
    return {
      Gender,
      LifeStatus,

      search: "",
      page: 1,
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
        { text: "", value: "actions", sortable: false },
      ],
    };
  },
  computed: {
    peopleList() {
      const people = this.$store.state.people as Person[];
      return filterPeople(people, (this as any).search);
    },
    peopleTableInMobileLayout() {
      return this.$vuetify.breakpoint.width < 600; // 600: default mobile-breakpoint of v-data-table
    },
  },
  watch: {
    search() {
      this.page = 1;
    },
  },
  methods: {
    showDialogAddOrCreatePerson,
    transformDateString,
    ...mapActions([FETCH_PEOPLE]),
    sortPeople(people: Person[], sortBy: string[], sortDesc: boolean[]) {
      let compare: (v1: any, v2: any, k1: Person, k2: Person) => number = (
        a: any,
        b: any
      ) => {
        if (!a.toString) return 1;
        if (!b.toString) return -1;
        return a.toString().localeCompare(b.toString());
      };

      const sortField = sortBy[0] == "status_deathday" ? "status" : sortBy[0];

      if (sortField == "status") {
        compare = (v1, v2, k1, k2) => {
          if (v1 != v2) {
            return v1 == LifeStatus.ALIVE ? -1 : 1;
          }
          return compareTwoDateString(k1.deathday, k2.deathday, sortDesc[0]);
        };
      }

      if (sortField == "birthday") {
        compare = (v1, v2) => {
          return compareTwoDateString(v1, v2, sortDesc[0]);
        };
      }

      const indices = people.map((v, index) => index);
      if (sortDesc[0]) {
        const _compare = compare;
        compare = (a, b, k1, k2) => -_compare(a, b, k1, k2);
      }
      indices.sort((a, b) => {
        const v1 = people[a][sortField as keyof Person];
        const v2 = people[b][sortField as keyof Person];

        if (!v1) {
          if (!v2) return 0;
          return 1;
        }
        if (!v2) return -1;

        if (compare) {
          return compare(v1, v2, people[a], people[b]);
        }

        return 0;
      });

      return indices.map((i) => people[i]);
    },
    deletePerson(person: Person) {
      const onConfirmed = async () => {
        await personApi.deletePerson({ id: person.id }).then(() => {
          this[FETCH_PEOPLE]();
        });
      };
      showDialogConfirm({
        onConfirmed,
        header: `Bạn có chắc chắn muốn xóa ${person.callname} không?`,
        info: "Nếu xóa người này, mối quan hệ của những người liên quan với người này sẽ bị xóa",
        confirmText: "Xóa",
        confirmColor: "error",
      });
    },
    editPerson(person: Person) {
      showDialogAddOrCreatePerson({
        person,
      });
    },
  },
});
</script>
