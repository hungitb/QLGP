<template>
  <div
    id="family-tree"
    class="d-flex justify-center align-center"
    ref="container"
  >
    <Viewer ref="viewer" v-if="ancestor && !$store.state.isLoadingPeople">
      <FamilyCard
        ref="familyCard"
        :person="ancestor"
        :config="config"
        :viewer="viewer"
        @addPersonRelationShipDone="handlePersonAddRelationship"
      />
    </Viewer>
    <FullViewLoading :floating="false" v-else />
  </div>
</template>

<script lang="ts">
import Vue, { nextTick } from "vue";

import Viewer from "@/components/Viewer.vue";
import FamilyCard from "@/components/FamilyCard/index";
import FullViewLoading from "@/components/FullViewLoading.vue";
import { personApi } from "@/api/person";
import { ExtendedPerson } from "../../../general/controller/person";
import { PersonCardLayout, type FamilyCardConfig } from "@/components/types";
import { mapActions } from "vuex";
import { FETCH_PEOPLE } from "@/store";

export default Vue.extend({
  components: {
    Viewer,
    FamilyCard,
    FullViewLoading,
  },
  data() {
    return {
      viewer: undefined as any,
      ancestor: null as ExtendedPerson | null,
      interval: null as number | null,
      focusSubjectAfterFetched: true,
      // Danh sách person id để focus, ưu tiên cuối
      focusPersonIds: [] as string[],
      config: {
        level: 3,
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
    ...mapActions([FETCH_PEOPLE]),
    resizeViewer() {
      if (!this.$refs.viewer || !this.$refs.container) return;
      const container = this.$refs.container as HTMLElement;
      const viewer = (this.$refs.viewer as any).$el as HTMLElement;
      const containerBCR = container.getBoundingClientRect();

      viewer.style.width = window.innerWidth - containerBCR.left + "px";
      viewer.style.height = window.innerHeight - containerBCR.top + "px";
    },
    handlePersonAddRelationship({
      addedPersonId,
      personId,
    }: {
      addedPersonId: string;
      personId: string;
    }) {
      this.focusSubjectAfterFetched = false;
      this.focusPersonIds.push(personId);
      this.focusPersonIds.push(addedPersonId);
      this.loadData();
    },
    loadData() {
      this.ancestor = null; // Nếu không có cái này và FETCH_PEOPLE xong trước thì sẽ xảy ra hiện tượng giật hình
      Promise.all([
        this[FETCH_PEOPLE](),
        personApi.getFamilyTreeInfo({ level: this.config.level }),
      ]).then(async ([_, familyTreeRespone]) => {
        const { data } = familyTreeRespone;

        if (data.ancestor) {
          this.ancestor = data.ancestor;

          await nextTick();

          this.viewer = this.$refs.viewer;
          this.resizeViewer();
          setTimeout(this.resizeViewer, 100);
          this.interval = setInterval(this.resizeViewer, 2000);

          const familyCard = this.$refs.familyCard as any;
          if (!familyCard) {
            return;
          }

          if (this.focusSubjectAfterFetched && data.subjectId) {
            this.focusPersonIds.push(data.subjectId);
          }

          let targetElement: any = null;
          // Tìm id để focus, ưu tiên cuối cùng, nếu không được thì gần cuối, không được nữa thì thôi
          let temp = this.focusPersonIds[this.focusPersonIds.length - 1];
          if (temp) {
            let temp2 = familyCard.findCardElementByPersonId(temp);
            targetElement = temp2[0];
          }
          if (!targetElement) {
            temp = this.focusPersonIds[this.focusPersonIds.length - 2];
            if (temp) {
              let temp2 = familyCard.findCardElementByPersonId(temp);
              targetElement = temp2[0];
            }
          }

          if (targetElement) {
            (this.$refs.viewer as any).focusElement(targetElement);
          }
        }
      });
    },
  },
  mounted() {
    this.loadData();
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
