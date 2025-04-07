<template>
  <div>
    <v-row>
      <v-col cols="12" md="6">
        <PersonInputGroup
          v-model="id1"
          label="Thành viên 1"
          one
          :exception-ids="id2 ? [id2] : []"
        />
      </v-col>
      <v-col cols="12" md="6">
        <PersonInputGroup
          v-model="id2"
          label="Thành viên 2"
          one
          :exception-ids="id1 ? [id1] : []"
        />
      </v-col>
    </v-row>

    <div v-if="!isLoading && id1 && id2 && calls">
      <div class="text-h4 mt-2">
        Cách {{ $store.state.personMapping[id1].callname }} gọi
        {{ $store.state.personMapping[id2].callname }}
      </div>
      <div>{{ calls[0] }}</div>
      <div class="text-h4 mt-6">
        Cách {{ $store.state.personMapping[id2].callname }} gọi
        {{ $store.state.personMapping[id1].callname }}
      </div>
      <div>{{ calls[1] }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PersonInputGroup from "@/components/input/PersonInputGroup.vue";
import { personApi } from "@/api/person";

export default defineComponent({
  components: {
    PersonInputGroup,
  },
  data() {
    return {
      id1: null as string | null,
      id2: null as string | null,
      isLoading: false,
      calls: null as [string, string] | null,
    };
  },
  watch: {
    id1(v) {
      if (v && this.id2) {
        this.analyze();
      }
    },
    id2(v) {
      if (v && this.id1) {
        this.analyze();
      }
    },
  },
  methods: {
    async analyze() {
      if (!this.id1 || !this.id2) {
        return;
      }

      this.isLoading = true;

      const { data } = await personApi.analyzeRelationship({
        id1: this.id1,
        id2: this.id2,
      });

      if ("data" in data) {
        this.calls = data.data;
      } else {
        const msg = `Lỗi: ${data.msg}`;
        this.calls = [msg, msg];
      }

      this.isLoading = false;
    },
  },
});
</script>
