<template>
  <v-container>
    <v-row class="py-3">
      <v-col cols="12" lg="9">
        <v-row>
          <v-col cols="12">
            <v-row>
              <v-col cols="12" sm="6">
                <v-card>
                  <v-card-text>
                    <div class="d-flex">
                      <div class="d-flex flex-column justify-space-between">
                        <div>Số lượng nam</div>
                        <div class="text-h6">
                          <v-skeleton-loader
                            v-if="$store.state.isLoadingPeople"
                            type="text"
                            width="40"
                          ></v-skeleton-loader>
                          <template v-else>
                            {{
                              $store.state.people.filter(
                                (p) => p.gender == Gender.MALE
                              ).length
                            }}
                          </template>
                        </div>
                      </div>
                      <v-spacer></v-spacer>
                      <CustomPersonAvatar
                        :person="{
                          gender: Gender.MALE,
                          avatarUrl: null,
                          callname: '',
                        }"
                      />
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="6">
                <v-card>
                  <v-card-text>
                    <div class="d-flex">
                      <div class="d-flex flex-column justify-space-between">
                        <div>Số lượng nữ</div>
                        <div class="text-h6">
                          <v-skeleton-loader
                            v-if="$store.state.isLoadingPeople"
                            type="text"
                            width="40"
                          ></v-skeleton-loader>
                          <template v-else>
                            {{
                              $store.state.people.filter(
                                (p) => p.gender == Gender.FEMALE
                              ).length
                            }}
                          </template>
                        </div>
                      </div>
                      <v-spacer></v-spacer>
                      <CustomPersonAvatar
                        :person="{
                          gender: Gender.FEMALE,
                          avatarUrl: null,
                          callname: '',
                        }"
                      />
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12">
            <v-card>
              <v-card-title>
                Danh sách người thân
                <template v-if="!$vuetify.breakpoint.smAndDown">
                  <v-divider vertical class="mx-4"></v-divider>
                  <v-btn
                    @click="showDialogAddOrCreatePerson"
                    outlined
                    color="primary"
                  >
                    <v-icon left>mdi-account-plus</v-icon> Thêm
                  </v-btn>
                </template>
                <v-spacer></v-spacer>
                <v-text-field
                  v-model="search"
                  append-icon="mdi-magnify"
                  label="Tìm kiếm"
                  single-line
                  outlined
                  dense
                  hide-details
                  tabindex="-1"
                ></v-text-field>
              </v-card-title>
              <v-divider></v-divider>
              <v-data-table
                :headers="headers"
                :items="peopleList"
                :loading="$store.state.isLoadingPeople"
                :custom-sort="sortPeople"
                :page.sync="page"
                item-key="id"
                @click:row="showDialogPersonDetailInfo"
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
                  v-slot:header.birthdate="{ header }"
                  v-if="!$vuetify.breakpoint.xs"
                >
                  <span
                    style="display: inline-block; text-align: end; width: 80px"
                    >{{ header.text }}</span
                  >
                </template>

                <template v-slot:item.birthdate="{ item }">
                  <span
                    v-if="item.birthdate"
                    :style="
                      $vuetify.breakpoint.xs
                        ? {}
                        : {
                            display: 'inline-block',
                            textAlign: 'end',
                            width: '80px',
                          }
                    "
                  >
                    {{
                      transformDateString(item.birthdate, {
                        showLunarDate: false,
                      })
                    }}
                  </span>
                </template>

                <template v-slot:item.status_deathdate="{ item }">
                  <template v-if="item.status == LifeStatus.ALIVE">
                    <span style="color: green">Còn sống</span>
                  </template>

                  <template v-else-if="item.status == LifeStatus.DEAD">
                    <span style="color: red">Đã mất</span>
                    <span v-if="item.deathdate" class="ml-2">
                      {{
                        transformDateString(item.deathdate, {
                          showNormalDate: !$vuetify.breakpoint.xs,
                          showLunarDate: !$vuetify.breakpoint.xs,
                        })
                      }}
                    </span>
                  </template>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" lg="3">
        <v-row>
          <v-col cols="12" lg="12">
            <v-card>
              <v-card-title>Sự kiện sắp tới</v-card-title>
              <v-card-subtitle>7 ngày sắp tới</v-card-subtitle>
              <v-card-text>
                <div v-if="eventsLoading" class="d-flex justify-center py-5">
                  <v-progress-circular
                    indeterminate
                    color="primary"
                  ></v-progress-circular>
                </div>
                <template v-else>
                  <v-list v-if="events.length > 0" class="mx-n4 mt-n4">
                    <v-list-item
                      v-for="event in events"
                      :key="event.personId + event.normalDate + event.type"
                    >
                      <v-list-item-avatar>
                        <CustomPersonAvatar
                          :person="$store.state.personMapping[event.personId]"
                          textSize="5"
                        ></CustomPersonAvatar>
                      </v-list-item-avatar>

                      <v-list-item-content>
                        <v-list-item-title>{{
                          $store.state.personMapping[event.personId].callname
                        }}</v-list-item-title>
                        <v-list-item-subtitle>
                          <span class="text--primary" style="line-height: 24px">
                            {{
                              allEventTypes.find((et) => et.value == event.type)
                                ?.text
                            }}
                          </span>
                          —
                          {{
                            event.normalDate.split("/").slice(0, 2).join("/")
                          }}
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                  <div v-else class="grey--text" style="height: 50px">
                    Không có sự kiện nào cả
                  </div>
                </template>
              </v-card-text>
              <v-card-actions v-if="!eventsLoading">
                <v-btn color="primary" text to="/upcoming_events">
                  Xem nhiều hơn
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Hard code position -->
    <div
      v-if="$vuetify.breakpoint.smAndDown"
      style="position: fixed; right: 12px; bottom: 72px"
    >
      <v-btn
        fab
        dark
        color="primary"
        :large="$vuetify.breakpoint.sm ? true : undefined"
        @click="showDialogAddOrCreatePerson"
      >
        <v-icon>mdi-account-plus</v-icon>
      </v-btn>
    </div>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";

import { Gender, LifeStatus, Person } from "../../../backend/src/model/Person";
import { eventApi } from "@/api/event";
import { type Event } from "../../../backend/src/controller/event";
import { allEventTypes } from "../../../backend/src/model/EventSetting";
import {
  compareTwoDateString,
  transformDateString,
  todayDate,
  datePlusDay,
} from "../../../backend/src/utils/DateUtils";
import CustomPersonAvatar from "@/components/CustomPersonAvatar.vue";
import { filterPeople } from "../../../backend/src/controller/person";
import {
  showDialogAddOrCreatePerson,
  showDialogPersonDetailInfo,
} from "@/components/utilities";

export default Vue.extend({
  components: {
    CustomPersonAvatar,
  },
  data: function () {
    return {
      allEventTypes,
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
          value: "birthdate",
        },
        {
          text: "Tình trạng",
          value: "status_deathdate",
        },
      ],

      // Events
      eventsLoading: true,
      events: [] as Event[],
    };
  },
  computed: {
    peopleList() {
      const people = this.$store.state.people as Person[];
      return filterPeople(people, (this as any).search);
    },
  },
  watch: {
    search() {
      this.page = 1;
    },
  },
  methods: {
    transformDateString,
    sortPeople(people: Person[], sortBy: string[], sortDesc: boolean[]) {
      let compare: (v1: any, v2: any, k1: Person, k2: Person) => number = (
        a: any,
        b: any
      ) => {
        if (!a.toString) return 1;
        if (!b.toString) return -1;
        return a.toString().localeCompare(b.toString());
      };

      const sortField = sortBy[0] == "status_deathdate" ? "status" : sortBy[0];

      if (sortField == "status") {
        compare = (v1, v2, k1, k2) => {
          if (v1 != v2) {
            return v1 == LifeStatus.ALIVE ? -1 : 1;
          }
          return compareTwoDateString(k1.deathdate, k2.deathdate, sortDesc[0]);
        };
      }

      if (sortField == "birthdate") {
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
    showDialogAddOrCreatePerson() {
      showDialogAddOrCreatePerson({ onDone: this.fetchEvents });
    },
    showDialogPersonDetailInfo(person: Person) {
      showDialogPersonDetailInfo({
        personId: person.id,
        editable: true,
        onPersonEdited: this.fetchEvents,
        onPersonDeleted: this.fetchEvents,
      });
    },
    fetchEvents() {
      this.eventsLoading = true;
      eventApi
        .getEvents({
          startDate: todayDate(),
          endDate: datePlusDay(todayDate(), 7),
        })
        .then(({ data }) => {
          const { events } = data;
          this.events = events;
        })
        .finally(() => {
          this.eventsLoading = false;
        });
    },
  },
  mounted() {
    this.fetchEvents();
  },
});
</script>
