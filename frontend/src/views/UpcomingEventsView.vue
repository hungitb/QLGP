<template>
  <v-container>
    <v-row>
      <v-col cols="12" lg="6">
        <div class="d-flex align-center">
          <v-toolbar flat>
            <v-spacer />
            <v-btn
              :x-small="isSmallScreen ? true : undefined"
              text
              color="grey darken-2"
              @click="prev"
            >
              <v-icon> mdi-chevron-left </v-icon>
            </v-btn>
            <v-toolbar-title class="mx-4">
              {{ title }}
            </v-toolbar-title>
            <v-btn
              :x-small="isSmallScreen ? true : undefined"
              text
              color="grey darken-2"
              @click="next"
            >
              <v-icon> mdi-chevron-right </v-icon>
            </v-btn>
            <v-spacer />
          </v-toolbar>

          <CustomDialog
            v-model="dialogSetting"
            header="Cài đặt sự kiện"
            headerPaddingX="px-4"
            noPadding
            buttonText
            maxWidth="500"
            :buttons="[{ text: 'Lưu', click: saveEventSetting }]"
            xsFullScreen
          >
            <v-list subheader flat three-line>
              <v-subheader class="px-6">Đối tượng sự kiện</v-subheader>

              <v-radio-group class="mt-0" v-model="eventTargetTypeSetting">
                <v-list-item class="px-6">
                  <v-list-item-action>
                    <v-radio value="all"></v-radio>
                  </v-list-item-action>
                  <v-list-item-content>
                    <v-list-item-title>Tất cả mọi người</v-list-item-title>
                    <v-list-item-subtitle>
                      Tất cả mọi người trong danh sách thành viên sẽ
                      xuất hiện trong sự kiện sắp tới
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item class="px-6">
                  <v-list-item-action>
                    <v-radio value="specific"></v-radio>
                  </v-list-item-action>
                  <v-list-item-content>
                    <v-list-item-title>
                      Những người được chỉ định
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      Bạn sẽ chọn ra những người cụ thể mà bạn mong muốn sẽ xuất
                      hiện trong sự kiện sắp tới
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <div class="pr-6" style="padding-left: 80px">
                  <v-expand-transition style="width: 100%">
                    <div
                      v-if="eventTargetTypeSetting == 'specific'"
                      class="pt-4"
                    >
                      <PersonInputGroup
                        v-model="eventTargetPersonIds"
                        label="Thành viên"
                      />
                    </div>
                  </v-expand-transition>
                </div>
              </v-radio-group>
            </v-list>

            <v-divider></v-divider>

            <v-list flat subheader three-line>
              <v-subheader class="px-6">Loại sự kiện</v-subheader>

              <v-list-item-group
                v-model="choosedEventTypes"
                multiple
                active-class=""
              >
                <v-list-item
                  class="px-6"
                  v-for="event in allEventTypes.filter((et) => !et.default)"
                  :key="event.value"
                  :value="event.value"
                >
                  <template v-slot:default="{ active }">
                    <v-list-item-action>
                      <v-checkbox :input-value="active"></v-checkbox>
                    </v-list-item-action>

                    <v-list-item-content>
                      <v-list-item-title>{{ event.text }}</v-list-item-title>
                      <v-list-item-subtitle>
                        <span style="line-height: 24px">
                          {{ event.desc }}
                        </span>
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </template>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </CustomDialog>
          <v-btn
            :small="isSmallScreen ? true : undefined"
            outlined
            color="primary"
            :disabled="isLoading"
            @click="dialogSetting = true"
          >
            <v-icon left> mdi-table-cog </v-icon>
            Cài đặt
          </v-btn>
        </div>

        <v-progress-linear indeterminate v-if="isLoading"></v-progress-linear>

        <v-calendar
          ref="calendar"
          style="height: min-content"
          v-model="value"
          type="month"
          :events="events"
          event-color="transparent"
          :event-height="26"
          :show-month-on-first="false"
        >
          <template v-slot:event="{ event }">
            <CustomPersonAvatar
              class="mb-1 ml-1"
              :person="event.person"
              size="24"
            />
          </template>
        </v-calendar>
      </v-col>
      <v-col cols="12" lg="6">
        <v-alert
          class="mt-3"
          color="primary"
          outlined
          v-if="!isLoading && events.length == 0"
        >
          <div class="text-h6">Không có sự kiện nào trong tháng này!</div>
          <div>
            Có thể cập nhật ngày sinh, ngày mất cho các thành viên để
            xem được thông tin về các sự kiện liên quan đến họ. Bạn cũng có thể
            tùy chỉnh những người bạn muốn xem thông tin về sự kiện trong phần
            cài đặt.
          </div>
        </v-alert>
        <v-list three-line>
          <template v-for="item in items">
            <v-subheader
              v-if="item.header"
              :key="item.key"
              v-text="item.header"
            ></v-subheader>

            <v-divider
              v-else-if="item.divider"
              :key="'divider' + item.key"
              inset
            ></v-divider>

            <v-list-item v-else :key="'list-item' + item.key">
              <v-list-item-avatar>
                <CustomPersonAvatar :person="item.person" textSize="5" />
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title>
                  {{ item.person.callname }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  <!-- Line-height mặc định hiện chữ ngày giỗ bị mất dấu ngã -->
                  <span class="text--primary" style="line-height: 24px">
                    {{ item.type }}
                  </span>
                  <template v-if="item.explain">
                    — {{ item.explain }}
                  </template>
                </v-list-item-subtitle>

                <v-list-item-subtitle
                  v-if="item.originalDateExplain"
                  v-text="item.originalDateExplain"
                ></v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import CustomPersonAvatar from "@/components/CustomPersonAvatar.vue";
import {
  EventTargetType,
  EventType,
  allEventTypes,
} from "../../../backend/src/controller/event";
import { Person } from "../../../backend/src/model/Person";
import {
  createStandardFormDateFromDayMonthYear,
  normalDateToLunarDate,
  transformDateString,
} from "../../../backend/src/utils/DateUtils";
import CustomDialog from "@/components/CustomDialog.vue";
import PersonInputGroup from "@/components/input/PersonInputGroup.vue";
import { showSnackbar } from "@/components/utilities";
import {
  getEventSettingFromLocalStorage,
  permissionMixin,
  saveEventSettingToLocalStorage,
} from "@/utils";
import { personApi } from "@/api/person";

export default defineComponent({
  components: {
    CustomPersonAvatar,
    CustomDialog,
    PersonInputGroup,
  },
  mixins: [permissionMixin],
  data() {
    return {
      EventTargetType,
      value: "",
      title: "",
      dialogSetting: false,
      isLoading: true,
      items: [] as any[],
      events: [] as any[],

      // Setting
      allEventTypes,
      eventTargetTypeSetting: "all" as "all" | "specific",
      eventTargetPersonIds: [] as string[],
      choosedEventTypes: [] as EventType[],
    };
  },
  computed: {
    isSmallScreen() {
      return (this as any).$vuetify.breakpoint.width < 500;
    },
  },
  methods: {
    prev() {
      (this.$refs.calendar as any).prev();
    },
    next() {
      (this.$refs.calendar as any).next();
    },
    setThisMonth() {
      const date = new Date();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      this.value = `${year}-${month}-1`;
    },
    updateTitle() {
      const [year, month] = this.value.split("-").map((s) => parseInt(s));
      this.title = this.isSmallScreen
        ? `T${month}/${year}`
        : `Tháng ${month}/${year}`;
    },
    async fetchEvents() {
      this.events = [];
      this.items = [];
      this.isLoading = true;
      const [year, month] = this.value.split("-").map((s) => parseInt(s));
      const backupValue = this.value;
      const eventSetting = getEventSettingFromLocalStorage();
      const { data } = await personApi.getEvents({
        startDate: createStandardFormDateFromDayMonthYear(1, month, year),
        endDate: month == 12
          ? createStandardFormDateFromDayMonthYear(1, 1, year + 1)
          : createStandardFormDateFromDayMonthYear(1, month + 1, year),
        allPeople: eventSetting.allPeople,
        personIds: eventSetting.personIds?.join(","),
        eventTypes: eventSetting.eventTypes?.join(","),
      });

      // Trong khi fetch thì dữ liệu đã bị thay đổi, vì thế sẽ bỏ qua
      if (this.value != backupValue) {
        return;
      }

      if (!("events" in data)) {
        this.isLoading = false;
        return;
      }

      let lastDate: string | null = null;
      const today = new Date();
      const typeMapping = allEventTypes.reduce((result, { text, value }) => {
        result[value] = text;
        return result;
      }, {});

      type ItemHeader = { header: string };
      type ItemDivider = { divider: true };
      type ItemEvent = {
        person: Person;
        type: string;
        explain?: string;
        originalDateExplain: string;
      };

      const items: (ItemHeader | ItemDivider | ItemEvent)[] = [];
      data.events.forEach(
        ({ type, personId, normalDate, explain }, index, events) => {
          if (lastDate != normalDate) {
            const [d, m, y] = normalDate.split("/").map((s) => parseInt(s));
            const deltaDays = Math.round(
              (new Date(y, m - 1, d).getTime() - today.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            let header = "";
            if (deltaDays == -1) header = `Hôm qua,`;
            else if (deltaDays == 0) header = `Hôm nay,`;
            else if (deltaDays == 1) header = `Ngày mai,`;
            else if (deltaDays == 2) header = `Ngày kia,`;

            header += ` ${normalDate} — ${normalDateToLunarDate(
              normalDate
            )} Âm lịch`;

            items.push({ header });
            lastDate = normalDate;
          }

          const person = this.$store.state.personMapping[personId] as Person;
          var originalDateExplain: string;
          if (type == EventType.BIRTHDAY) {
            const birthdateText = person.birthdate ? transformDateString(
              person.birthdate,
              { showLunarDate: false }
            ) : "NaN";
            originalDateExplain = `Sinh ngày ${birthdateText}`;
          } else if (type == EventType.DEATHDAY) {
            const deathdateText = person.deathdate ? transformDateString(
              person.deathdate
            ) : "NaN";
            originalDateExplain = `Mất ngày ${deathdateText}`;
          } else {
            originalDateExplain = "";
          }

          items.push({
            person,
            type: typeMapping[type],
            explain,
            originalDateExplain,
          });

          const [day, month, year] = normalDate
            .split("/")
            .map((s) => parseInt(s));
          this.events.push({
            person,
            start: new Date(year, month - 1, day),
          });

          if (index != events.length - 1) {
            items.push({
              divider: true,
            });
          }
        }
      );

      this.items = items.map((item) => {
        return {
          ...item,
          key: "key" + Math.round(Math.random() * 10e10),
        };
      });

      this.isLoading = false;
    },
    async saveEventSetting() {
      const form = this.$refs.form;
      if (form && !(form as any).validate()) {
        return;
      }

      if (this.eventTargetTypeSetting == "all") {
        saveEventSettingToLocalStorage({
          allPeople: true,
          eventTypes: this.choosedEventTypes,
        });
      } else if (this.eventTargetTypeSetting == "specific") {
        saveEventSettingToLocalStorage({
          allPeople: false,
          eventTypes: this.choosedEventTypes,
          personIds: this.eventTargetPersonIds,
        });
      } else {
        const x: never = this.eventTargetTypeSetting;
      }

      showSnackbar({ msg: "Lưu cài đặt sự kiện thành công" });
      this.dialogSetting = false;
      this.fetchEvents();
    },
  },
  watch: {
    value(newVal, oldVal) {
      const [newYear, newDay] = newVal.split("-").map((s: any) => parseInt(s));
      const [oldYear, oldDay] = oldVal.split("-").map((s: any) => parseInt(s));
      if (newYear == oldYear && newDay == oldDay) {
        return;
      }

      this.updateTitle();
      this.fetchEvents();
    },
    dialogSetting(value) {
      const eventSetting = getEventSettingFromLocalStorage();

      if (value) {
        this.eventTargetTypeSetting = eventSetting.allPeople
          ? "all"
          : "specific";

        if (eventSetting.personIds) {
          const validPersonIds = new Set(this.$store.state.people.map(p => p.id));
          this.eventTargetPersonIds = eventSetting.personIds.filter(id => validPersonIds.has(id));
        } else {
          this.eventTargetPersonIds = [];
        }
        if (
          !eventSetting.eventTypes &&
          !Array.isArray(eventSetting.eventTypes)
        ) {
          this.choosedEventTypes = allEventTypes
            .filter((et) => !et.default)
            .map((et) => et.value);
        } else {
          this.choosedEventTypes = eventSetting.eventTypes as EventType[];
        }
      }
    },
  },
  mounted() {
    this.setThisMonth();
    this.updateTitle();
  },
});
</script>
