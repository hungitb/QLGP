<template>
  <div>
    <div class="mx-auto" style="max-width: 500px">
      <v-timeline :dense="dense">
        <v-timeline-item
          v-for="(p, i) in detailPeople"
          :key="i"
          :right="dense ? true : undefined"
          :style="{ marginBottom: `${p.marginBottom}px` }"
        >
          <template v-if="!dense" v-slot:opposite>
            <template v-if="p.year">
              {{ p.year }}
            </template>
          </template>

          <template v-slot:icon>
            <CustomPersonAvatar
              :person="p"
              :textSize="'5'"
            ></CustomPersonAvatar>
          </template>

          <v-card>
            <div class="pa-3">
              <div class="font-weight-bold">
                {{ p.callname }}
                <template v-if="p.year && dense"> ({{ p.year }}) </template>
              </div>

              <div>
                <template v-if="i == 0">Tổ tiên</template>
                <template v-else>Đời thứ {{ i + 1 }}</template>
              </div>
            </div>
          </v-card>
        </v-timeline-item>
      </v-timeline>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CustomPersonAvatar from "../CustomPersonAvatar.vue";
import { DateStoredDB } from "../../../../backend/src/utils/DateUtils";
import {
  genderDisplayText,
  Person,
} from "../../../../backend/src/model/Person";

/** Cấu hình này là của vuetify */
const TIMELINE_ITEM_PADDING_BOTTOM = 24;

/** Giả sử đây là height của card trong timeline item, cái này đo trên giao diện, có thể khác nếu chữ xuống dòng trên màn hình nhỏ */
const TIMELINE_PERSON_CARD_HEIGHT = 68;

/** Khoảng cách độ dài 1 năm trong timeline */
const ONE_YEAR_DISTANCE = 6;

/** Khoảng cách năm mặc định giữa 2 người nếu không rõ ngày sinh hoặc ngày sinh không hợp lệ */
const DEFAULT_DIFF_YEAR = 20;

/** Khoảng cách số năm tối đa */
const MAX_DIFF_YEAR = 50;

export default defineComponent({
  components: {
    CustomPersonAvatar,
  },
  props: {
    path: {
      type: Array as () => string[],
      required: true,
    },
    dense: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      genderDisplayText,
    };
  },
  computed: {
    detailPeople() {
      const people = [...(this as any).path]
        .reverse()
        .map((id) => (this as any).$store.state.personMapping[id] as Person);

      const years = people.map((p) =>
        p.birthdate ? ((this as any).getYear(p.birthdate) as number) : null
      );

      return people.map((p, i, people) => {
        var marginBottom: number;
        if (i == people.length - 1) {
          marginBottom = 0;
        } else {
          const year = years[i];
          const nextGenYear = years[i + 1];

          const diffYears =
            year && nextGenYear && nextGenYear - year > 0
              ? Math.min(nextGenYear - year, MAX_DIFF_YEAR)
              : DEFAULT_DIFF_YEAR;

          marginBottom = Math.max(
            diffYears * ONE_YEAR_DISTANCE -
              TIMELINE_ITEM_PADDING_BOTTOM -
              TIMELINE_PERSON_CARD_HEIGHT,
            0
          );
        }

        return {
          ...p,
          year: years[i],
          marginBottom,
        };
      });
    },
  },
  methods: {
    getYear(date: DateStoredDB) {
      const temp = date.includes("AL") ? date.split("AL")[1] : date;

      const splited = temp.split("/");
      return parseInt(splited[splited.length - 1]);
    },
  },
});
</script>
