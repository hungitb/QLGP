<template>
  <div
    class="person-card-wrapper"
    @mouseover="onMouseover"
    @mouseleave="onMouseleave"
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
          v-if="
            config.show.name ||
            config.show.gender ||
            config.show.birthdate ||
            config.show.status
          "
          :style="
            config.layout == PersonCardLayout.MIN_WIDTH
              ? {
                  textAlign: 'center',
                }
              : {}
          "
        >
          <div class="text-h6" v-if="config.show.name">
            {{ person.callname }}
          </div>
          <div v-if="config.show.gender">
            {{ person.gender == Gender.MALE ? "Nam" : "Nữ" }}
          </div>
          <div v-if="config.show.birthdate">
            Ngày sinh:
            {{
              person.birthdate
                ? transformDateString(person.birthdate, {
                    showLunarDate: false,
                  })
                : "Không rõ"
            }}
          </div>
          <div v-if="config.show.status">
            Tình trạng:
            <template v-if="person.status == LifeStatus.ALIVE">
              Còn sống
            </template>
            <template v-else-if="person.status == LifeStatus.DEAD">
              Đã mất
              <template v-if="person.deathdate">
                -
                {{
                  transformDateString(person.deathdate, {
                    showNormalDate: false,
                  })
                }}
              </template>
            </template>
            <template v-else>Không rõ</template>
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
      <v-spacer />
      <Btn v-if="!person.motherId" @click="addPerson('mother')">Mẹ</Btn>
    </div>

    <div
      class="control bottom"
      v-if="(showControl || showingMobileOverlay) && !viewOnly"
    >
      <Btn @click="addPerson('child')">Con</Btn>
      <v-spacer />
      <Btn v-if="!person.spouseId" @click="addPerson('spouse')">Bạn đời</Btn>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import PersonCardButton from "./PersonCardButton.vue";
import { type ExtendedPerson } from "../../../../backend/src/controller/person";
import {
  Gender,
  LifeStatus,
  Person,
} from "../../../../backend/src/model/Person";
import { FamilyCardConfig, PersonCardLayout } from "../types";
import {
  showDialogAddPersonWithSpecificRole,
  showDialogPersonDetailInfo,
} from "@/components/utilities";
import { checkIfIsMobile } from "@/utils";
import CustomPersonAvatar from "../CustomPersonAvatar.vue";
import { transformDateString } from "../../../../backend/src/utils/DateUtils";

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
      timeoutClearMobileOverlay: undefined as number | undefined,
      timeoutHideControlDesktop: undefined as number | undefined,
    };
  },
  methods: {
    transformDateString,
    onMouseover() {
      if (this.timeoutHideControlDesktop) {
        clearTimeout(this.timeoutHideControlDesktop);
        this.timeoutHideControlDesktop = undefined;
      }

      this.showControl = true;
    },
    onMouseleave() {
      this.timeoutHideControlDesktop = setTimeout(() => {
        this.showControl = false;
        this.timeoutHideControlDesktop = undefined;
      }, 2000);
    },
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

        if (this.timeoutClearMobileOverlay) {
          clearTimeout(this.timeoutClearMobileOverlay);
        }

        this.timeoutClearMobileOverlay = setTimeout(() => {
          this.showingMobileOverlay = false;
          this.timeoutClearMobileOverlay = undefined;
        }, 4000);

        return;
      }

      this.viewPersonDetail();
    },
    viewPersonDetail() {
      showDialogPersonDetailInfo({ personId: this.person.id });
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
