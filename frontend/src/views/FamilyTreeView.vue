<template>
  <div
    id="family-tree"
    class="d-flex justify-center align-center"
    ref="container"
  >
    <Viewer ref="viewer">
      <FamilyCard
        v-if="ancestor"
        :person="ancestor"
        :peopleInfo="peopleInfo"
        :config="config"
      />
      <FullViewLoading v-else />
    </Viewer>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import Viewer from "@/components/Viewer.vue";
import FamilyCard from "@/components/FamilyCard.vue";
import FullViewLoading from "@/components/FullViewLoading.vue";
import { personApi } from "@/api/person";
import { ExtendedPerson } from "../../../general/controller/person";
import { Person } from "../../../general/model/Person";
import { PersonCardLayout, type FamilyCardConfig } from "@/components/types";

export default Vue.extend({
  components: {
    Viewer,
    FamilyCard,
    FullViewLoading,
  },
  data() {
    return {
      ancestor: null as ExtendedPerson | null,
      peopleInfo: {} as Record<string, Person>,
      interval: null as number | null,
      config: {
        level: 2,
        show: {
          image: true,
          name: true,
          gender: true,
          birthday: true,
          status: true,
        },
        layout: PersonCardLayout.MIN_HEIGHT,
        horizontalDistance: 80,
        verticalDistance: 300,
      } as FamilyCardConfig,
    };
  },
  methods: {
    resizeViewer() {
      const container = this.$refs.container as HTMLElement;
      const viewer = (this.$refs.viewer as any).$el as HTMLElement;
      const containerBCR = container.getBoundingClientRect();

      viewer.style.width = window.innerWidth - containerBCR.left + "px";
      viewer.style.height = window.innerHeight - containerBCR.top + "px";
    },
  },
  mounted() {
    this.resizeViewer();
    setTimeout(this.resizeViewer, 100);
    this.interval = setInterval(this.resizeViewer, 2000);

    personApi.getFamilyTreeInfo({ level: 3 }).then(({ data }) => {
      if (data.ancestor && data.people) {
        this.ancestor = data.ancestor;
        data.people.forEach((person) => {
          this.peopleInfo[person.id] = person;
        });
      }
    });
  },
  beforeDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  },
});
</script>

<style lang="scss">
#family-tree {
  height: 100%;
}
</style>
