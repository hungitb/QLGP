<template>
  <div
    class="person-card-wrapper"
    @mouseover="showControl = true"
    @mouseleave="showControl = false"
  >
    <div
      class="person-card d-flex justify-center align-center"
      @click="viewPersonDetail"
    >
      {{ person.callname }}
    </div>

    <div
      class="control top"
      v-if="(!person.fatherId || !person.motherId) && showControl"
    >
      <Btn v-if="!person.fatherId" @click="addPerson('father')">Bố</Btn>
      <Btn v-if="!person.motherId" @click="addPerson('mother')">Mẹ</Btn>
    </div>

    <div class="control bottom" v-if="showControl">
      <Btn @click="addPerson('child')">Con</Btn>
      <Btn v-if="!person.spouseId" @click="addPerson('spouse')">Bạn đời</Btn>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import PersonCardButton from "./PersonCardButton.vue";
import { type ExtendedPerson } from "../../../../general/controller/person";
import { Person } from "../../../../general/model/Person";
import { FamilyCardConfig } from "../types";
import { showDialogAddPersonWithSpecificRole } from "@/views/Utilities.vue";

export default Vue.extend({
  components: {
    Btn: PersonCardButton,
  },
  props: {
    person: {
      type: Object as () => ExtendedPerson | Person,
      required: true,
    },
    config: {
      type: Object as () => FamilyCardConfig,
      required: true,
    },
    viewer: {
      type: Object,
    },
  },
  data() {
    return {
      showControl: false,
    };
  },
  methods: {
    addPerson(type: string) {
      if (this.viewer && !this.viewer.isClickEvent()) {
        return;
      }
      showDialogAddPersonWithSpecificRole({
        person: this.person,
        roleOfPersonWillAdd: type,
        onAddedOrCreated: (addedPersonId) => {
          // addedPersonId: Id của người được thêm cho người hiện tại
          this.$emit("addPersonRelationShipDone", {
            personId: this.person.id,
            addedPersonId,
          });
        },
      });
    },
    viewPersonDetail() {
      if (this.viewer && !this.viewer.isClickEvent()) {
        return;
      }
      alert(JSON.stringify(this.person));
    },
  },
});
</script>

<style lang="scss">
.person-card-wrapper {
  height: 100px;
  width: 150px;
  position: relative;

  .person-card {
    border: 2px solid;
    width: 100%;
    height: 100%;
  }

  .control {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    padding-top: 8px;
    padding-bottom: 8px;

    &.top {
      bottom: 100%;
    }

    &.bottom {
      top: 100%;
    }
  }
}
</style>
