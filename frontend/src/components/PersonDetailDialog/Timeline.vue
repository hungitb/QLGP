<template>
  <div>
    <v-timeline dense>
      <v-timeline-item v-for="(p, i) in detailPeople" :key="i" right>
        <template v-slot:icon>
          <CustomPersonAvatar :person="p" :textSize="'6'"></CustomPersonAvatar>
        </template>

        <v-card>
          <div class="pa-3">
            <div class="font-weight-bold">
              {{ p.callname }}
              <template v-if="p.birthdate">
                ({{ getYear(p.birthdate) }})
              </template>
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
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CustomPersonAvatar from "../CustomPersonAvatar.vue";
import { DateStoredDB } from "../../../../backend/src/utils/DateUtils";

export default defineComponent({
  components: {
    CustomPersonAvatar,
  },
  props: {
    path: {
      type: Array as () => string[],
      required: true,
    },
  },
  data() {
    return {};
  },
  computed: {
    detailPeople() {
      const people = [...this.path]
        .reverse()
        .map((id) => this.$store.state.personMapping[id]);
      return people;
    },
  },
  methods: {
    getYear(date: DateStoredDB) {
      return date;
    },
  },
});
</script>
