<template>
  <div
    class="person-card-wrapper"
    @mouseover="showControl = true"
    @mouseleave="showControl = false"
  >
    <div
      class="person-card elevation-2"
      @click="handleClickPerson"
      :style="
        config.layout == PersonCardLayout.MIN_WIDTH
          ? { maxWidth: '128px' }
          : { maxHeight: '128px' }
      "
    >
      <div
        :class="
          'content d-flex justify-center align-center' +
          (config.layout == PersonCardLayout.MIN_WIDTH ? ' flex-column' : '')
        "
      >
        <div v-if="config.show.image">
          <CustomPersonAvatar :person="person" tile size="128" textSize="3" />
        </div>
        <div
          class="pa-3"
          :style="
            config.layout == PersonCardLayout.MIN_WIDTH
              ? {
                  textAlign: 'center',
                }
              : {}
          "
        >
          <div class="text-h6">{{ person.callname }}</div>
          <div v-if="config.show.gender">
            {{ person.gender == Gender.MALE ? "Nam" : "Nữ" }}
          </div>
          <div v-if="config.show.birthday">
            Ngày sinh:
            {{
              person.birthday
                ? transformDateString(person.birthday, { showLunarDate: false })
                : "Không rõ"
            }}
          </div>
          <div v-if="config.show.status">
            Tình trạng:
            <template v-if="!person.status">Không rõ</template>
            <template v-if="person.status == LifeStatus.ALIVE">
              Còn sống
            </template>
            <template v-if="person.status == LifeStatus.DEAD">
              Đã mất
              <template v-if="person.deathday">
                -
                {{
                  transformDateString(person.deathday, {
                    showNormalDate: false,
                  })
                }}
              </template>
            </template>
          </div>
        </div>
      </div>

      <div
        class="overlay flex-column d-flex justify-center align-center"
        v-if="showingMobileOverlay"
      >
        <span>{{ person.callname }}</span>
        <Btn icon="" @click="viewPersonDetail">Xem chi tiết</Btn>
      </div>
    </div>

    <div
      class="control top"
      v-if="
        (!person.fatherId || !person.motherId) &&
        (showControl || showingMobileOverlay) &&
        !viewOnly
      "
    >
      <Btn v-if="!person.fatherId" @click="addPerson('father')">Bố</Btn>
      <Btn v-if="!person.motherId" @click="addPerson('mother')">Mẹ</Btn>
    </div>

    <div
      class="control bottom"
      v-if="(showControl || showingMobileOverlay) && !viewOnly"
    >
      <Btn @click="addPerson('child')">Con</Btn>
      <Btn v-if="!person.spouseId" @click="addPerson('spouse')">Bạn đời</Btn>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import PersonCardButton from "./PersonCardButton.vue";
import { type ExtendedPerson } from "../../../../general/controller/person";
import { Gender, LifeStatus, Person } from "../../../../general/model/Person";
import { FamilyCardConfig, PersonCardLayout } from "../types";
import { showDialogAddPersonWithSpecificRole } from "@/views/Utilities.vue";
import { checkIfIsMobile } from "@/utils";
import CustomPersonAvatar from "../CustomPersonAvatar.vue";
import { transformDateString } from "../../../../general/utils/DateUtils";

export default Vue.extend({
  components: {
    CustomPersonAvatar,
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
    viewOnly: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      PersonCardLayout,
      Gender,
      LifeStatus,
      isMobile: checkIfIsMobile(),
      showingMobileOverlay: false,
      showControl: false,
    };
  },
  methods: {
    transformDateString,
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
    handleClickPerson() {
      if (this.viewOnly) {
        return;
      }
      if (this.viewer && !this.viewer.isClickEvent()) {
        return;
      }
      if (this.isMobile) {
        this.showingMobileOverlay = true;
        setTimeout(() => {
          this.showingMobileOverlay = false;
        }, 4000);
        return;
      }

      this.viewPersonDetail();
    },
    viewPersonDetail() {
      alert(JSON.stringify(this.person));
    },
  },
});
</script>

<style lang="scss">
.person-card-wrapper {
  background-color: white;
  position: relative;

  .person-card {
    // border: 1px solid;
    border-radius: 4px;
    width: max-content;
    height: max-content;
    overflow: hidden;
    position: relative;

    .content {
      width: 100%;
      height: 100%;
    }

    .overlay {
      background-color: aliceblue;
      position: absolute;
      inset: 0;
    }
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
