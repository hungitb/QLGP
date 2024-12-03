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
            :isLoading="isDialogSettingLoading"
            :buttons="[{ text: 'Lưu', click: saveEventSetting }]"
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
                      Tất cả mọi người trong danh sách người thân của bạn sẽ
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
                        label="Người thân"
                      />
                    </div>
                  </v-expand-transition>
                </div>

                <v-list-item class="px-6">
                  <v-list-item-action>
                    <v-radio
                      name="event-target-type"
                      value="closeRelationship"
                    ></v-radio>
                  </v-list-item-action>
                  <v-list-item-content>
                    <v-list-item-title>
                      Những người có quan hệ gần
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      Chỉ những người có quan hệ gần với bạn mới xuất hiện, mức
                      độ gần như thế nào sẽ do bạn quyết định
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <div class="pr-6" style="padding-left: 80px">
                  <v-expand-transition>
                    <div
                      v-if="eventTargetTypeSetting == 'closeRelationship'"
                      class="pt-4"
                    >
                      <v-form ref="form">
                        <v-select
                          v-model="peopleCloseRelationshipType"
                          :items="[
                            {
                              text: 'Gia phả mức 2',
                              value: '2',
                            },
                            {
                              text: 'Gia phả mức 3',
                              value: '3',
                            },
                          ]"
                          label="Kiểu đối tượng"
                          outlined
                        ></v-select>

                        <v-text-field
                          v-model="peopleCloseRelationshipNumGenerationAbove"
                          label="Số đời trên bạn"
                          outlined
                          :rules="numberRules"
                          validate-on-blur
                        ></v-text-field>

                        <v-text-field
                          v-model="peopleCloseRelationshipNumGenerationBelow"
                          label="Số đời dưới bạn"
                          outlined
                          :rules="numberRules"
                          validate-on-blur
                        ></v-text-field>

                        <v-checkbox
                          v-model="
                            peopleCloseRelationshipIncludeEqualGeneration
                          "
                          hide-details
                          class="mt-0"
                          label="Bao gồm những người ngang hàng bạn"
                        ></v-checkbox>
                      </v-form>
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
                  v-for="event in allEventTypes"
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
                        {{ event.desc }}
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
            Bạn có thể cập nhật ngày sinh, ngày mất cho người thân của bạn để
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
              :key="item.key"
              inset
            ></v-divider>

            <v-list-item v-else :key="item.key">
              <v-list-item-avatar>
                <CustomPersonAvatar :person="item.person" />
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

import { eventApi } from "@/api/event";
import CustomPersonAvatar from "@/components/CustomPersonAvatar.vue";
import {
  EventSetting,
  EventTargetType,
  EventType,
} from "../../../backend/src/model/EventSetting";
import { Person } from "../../../backend/src/model/Person";
import {
  normalDateToLunarDate,
  transformDateString,
} from "../../../backend/src/utils/DateUtils";
import CustomDialog from "@/components/CustomDialog.vue";
import PersonInputGroup from "@/components/input/PersonInputGroup.vue";
import { showSnackbar } from "@/components/utilities/ShowSnackbar.vue";

const allEventTypes = [
  {
    text: "Sinh nhật",
    value: EventType.BIRTHDAY,
    desc: "Sinh nhật, sự kiện này diễn ra một năm một lần",
  },
  {
    text: "Ngày giỗ",
    value: EventType.DEATHDAY,
    desc: "Ngày giỗ, sự kiện này diễn ra một năm một lần",
  },
];

export default defineComponent({
  components: {
    CustomPersonAvatar,
    CustomDialog,
    PersonInputGroup,
  },
  data() {
    return {
      EventTargetType,
      value: "",
      title: "",
      dialogSetting: false,
      isDialogSettingLoading: false,
      isLoading: true,
      items: [] as any[],
      events: [] as any[],
      eventSetting: {} as EventSetting,

      // Setting
      numberRules: [
        (v: string) => {
          const n = parseInt(v);
          if (isNaN(n) || n.toString() != v || n < 0) {
            return "Phải là số nguyên >= 0";
          }
          return true;
        },
      ],
      allEventTypes,
      eventTargetTypeSetting: "all" as "all" | "specific" | "closeRelationship",
      eventTargetPersonIds: [] as string[],
      peopleCloseRelationshipType: "2",
      peopleCloseRelationshipNumGenerationAbove: 0,
      peopleCloseRelationshipNumGenerationBelow: 0,
      peopleCloseRelationshipIncludeEqualGeneration: true,
      choosedEventTypes: [] as EventTargetType[],
    };
  },
  computed: {
    isSmallScreen() {
      return this.$vuetify.breakpoint.width < 500;
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
      const { data } = await eventApi.getEvents({
        startDate: `1/${month}/${year}`,
        endDate: month == 12 ? `1/1/${year + 1}` : `1/${month + 1}/${year}`,
      });
      // Trong khi fetch thì dữ liệu đã bị thay đổi, vì thế sẽ bỏ qua
      if (this.value != backupValue) {
        return;
      }

      if (!data.events) {
        this.isLoading = false;
        return;
      }

      let lastDate: string | null = null;
      const today = new Date();
      const typeMapping = {
        [EventType.BIRTHDATE]: "Ngày sinh",
        [EventType.BIRTHDAY]: "Sinh nhật",
        [EventType.DEATHDATE]: "Ngày mất",
        [EventType.DEATHDAY]: "Ngày giỗ",
      };

      const items: any[] = [];
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
          let originalDateExplain = "";
          if (type == EventType.BIRTHDAY) {
            originalDateExplain = `Sinh ngày ${transformDateString(
              person.birthdate || "",
              { showLunarDate: false }
            )}`;
          } else if (type == EventType.DEATHDAY) {
            originalDateExplain = `Mất ngày ${transformDateString(
              person.deathdate || ""
            )}`;
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

      if (data.eventSetting) {
        this.eventSetting = data.eventSetting;
      }

      this.isLoading = false;
    },
    async saveEventSetting() {
      const form = this.$refs.form;
      if (form && !(form as any).validate()) {
        return;
      }

      const eventSetting: Partial<EventSetting> = {};

      const eventTypesArray = [...this.choosedEventTypes];
      eventTypesArray.sort();
      eventSetting.types = eventTypesArray.join(",");

      if (this.eventTargetTypeSetting == "all") {
        eventSetting.targetType = EventTargetType.ALL;
      } else if (this.eventTargetTypeSetting == "specific") {
        eventSetting.targetType = EventTargetType.SPECIFIC_PEOPLE;
        eventSetting.specificPersonIds = this.eventTargetPersonIds.join(",");
      } else if (this.eventTargetTypeSetting == "closeRelationship") {
        eventSetting.targetType =
          this.peopleCloseRelationshipType == "3"
            ? EventTargetType.PEOPLE_IN_FAMILY_TREE_LEVEL_THREE
            : EventTargetType.PEOPLE_IN_FAMILY_TREE_LEVEL_TWO;
        eventSetting.numGenerationsAbove =
          this.peopleCloseRelationshipNumGenerationAbove;
        eventSetting.numGenerationsBelow =
          this.peopleCloseRelationshipNumGenerationBelow;
        eventSetting.includePeopleEqualGeneration =
          this.peopleCloseRelationshipIncludeEqualGeneration;
      }

      Object.keys(eventSetting).forEach((key) => {
        if (
          eventSetting[key as keyof EventSetting] ==
          this.eventSetting[key as keyof EventSetting]
        ) {
          delete eventSetting[key as keyof EventSetting];
        }
      });

      if (Object.keys(eventSetting).length == 0) {
        this.dialogSetting = false;
        return;
      }

      this.isDialogSettingLoading = true;
      await eventApi.updateEventSetting(eventSetting);
      showSnackbar({ msg: "Lưu cài đặt sự kiện thành công" });
      this.isDialogSettingLoading = false;

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
      if (value) {
        this.eventTargetTypeSetting = {
          [EventTargetType.ALL]: "all",
          [EventTargetType.PEOPLE_IN_FAMILY_TREE_LEVEL_TWO]:
            "closeRelationship",
          [EventTargetType.PEOPLE_IN_FAMILY_TREE_LEVEL_THREE]:
            "closeRelationship",
          [EventTargetType.SPECIFIC_PEOPLE]: "specific",
        }[this.eventSetting.targetType] as
          | "all"
          | "specific"
          | "closeRelationship";

        this.eventTargetPersonIds =
          this.eventSetting.specificPersonIds.split(",");
        this.peopleCloseRelationshipType =
          this.eventSetting.targetType ==
          EventTargetType.PEOPLE_IN_FAMILY_TREE_LEVEL_THREE
            ? "3"
            : "2";
        this.peopleCloseRelationshipNumGenerationAbove =
          this.eventSetting.numGenerationsAbove;
        this.peopleCloseRelationshipNumGenerationBelow =
          this.eventSetting.numGenerationsBelow;
        this.peopleCloseRelationshipIncludeEqualGeneration =
          this.eventSetting.includePeopleEqualGeneration;
        this.choosedEventTypes = this.eventSetting.types.split(
          ","
        ) as EventTargetType[];
      }
    },
  },
  mounted() {
    this.setThisMonth();
    this.updateTitle();
  },
});
</script>
