<template>
  <div
    id="family-tree"
    class="d-flex justify-center align-center"
    ref="container"
  >
    <Viewer
      ref="viewer"
      :key="key"
      v-if="ancestor && !$store.state.isLoadingPeople"
    >
      <FamilyCard
        ref="familyCard"
        :person="ancestor"
        :config="config"
        :viewer="viewer"
        @addPersonRelationShipDone="handlePersonAddRelationship"
      />
    </Viewer>
    <FullViewLoading :floating="false" v-else />

    <div style="position: fixed; right: 12px; bottom: 16px" v-if="viewer">
      <v-btn
        class="mx-2"
        fab
        dark
        color="primary"
        v-if="viewer.mustTriggerZoomManually"
        @click="viewer.scale(1.2)"
        :disabled="disableButtons"
      >
        <v-icon dark> mdi-magnify-plus-outline </v-icon>
      </v-btn>
      <v-btn
        class="mx-2"
        fab
        dark
        color="primary"
        v-if="viewer.mustTriggerZoomManually"
        @click="viewer.scale(1 / 1.2)"
        :disabled="disableButtons"
      >
        <v-icon dark> mdi-magnify-minus-outline </v-icon>
      </v-btn>
      <v-btn
        class="mx-2"
        fab
        dark
        color="primary"
        @click="() => focusSubject()"
        :disabled="disableButtons"
      >
        <v-icon dark> mdi-map-marker </v-icon>
      </v-btn>
      <v-btn
        class="mx-2"
        fab
        dark
        color="primary"
        :disabled="disableButtons"
        @click="openDialogSetting"
      >
        <v-icon dark> mdi-cog </v-icon>
      </v-btn>

      <CustomDialog
        v-model="dialogSetting"
        header="Cài đặt biểu đồ gia phả"
        buttonText
        :buttons="[{ text: 'Lưu', click: applySetting }]"
        maxWidth="600px"
      >
        <v-row>
          <v-col cols="12">
            <PersonInputGroup
              label="Chủ thể biểu đồ"
              one
              v-model="settingVModel.subjectId"
            />
          </v-col>

          <v-col cols="12">
            <v-select
              v-model="settingVModel.level"
              label="Cấu hình cây gia phả"
              :items="familyTreeLevelItems"
              :hint="
                familyTreeLevelItems.find(
                  ({ value }) => value == settingVModel.level
                )?.hint
              "
              persistent-hint
              outlined
            />
          </v-col>

          <v-col cols="12">
            <div class="d-flex flex-column align-center">
              <span>Xem trước</span>
              <PersonCard
                :person="$store.state.personStandForUser"
                viewOnly
                :config="settingVModel"
              />
            </div>
          </v-col>

          <v-col cols="12">
            <span>Thông tin thẻ người thân</span>
            <v-checkbox
              v-model="settingVModel.show.name"
              hide-details
              disabled
              label="Tên"
            />
            <v-checkbox
              v-model="settingVModel.show.gender"
              hide-details
              label="Giới tính"
            />
            <v-checkbox
              v-model="settingVModel.show.image"
              hide-details
              label="Ảnh đại diện"
            />
            <v-checkbox
              v-model="settingVModel.show.birthdate"
              hide-details
              label="Ngày sinh"
            />
            <v-checkbox
              v-model="settingVModel.show.status"
              hide-details
              label="Trạng thái, ngày mất (nếu có)"
            />
          </v-col>

          <v-col cols="12">
            <v-radio-group label="Bố cục" v-model="settingVModel.layout">
              <v-radio
                label="Tối ưu chiều rộng"
                :value="PersonCardLayout.MIN_WIDTH"
              ></v-radio>
              <v-radio
                label="Tối ưu chiều cao"
                :value="PersonCardLayout.MIN_HEIGHT"
              ></v-radio>
            </v-radio-group>
          </v-col>

          <v-col cols="12">
            <v-slider
              v-model="settingVModel.horizontalDistance"
              thumb-label="always"
              step="30"
              min="30"
              max="300"
            >
              <template v-slot:label
                ><span style="min-width: 145px; display: block"
                  >Khoảng cách ngang</span
                ></template
              >
            </v-slider>
          </v-col>

          <v-col cols="12">
            <v-slider
              v-model="settingVModel.verticalDistance"
              thumb-label="always"
              step="30"
              min="30"
              max="300"
            >
              <template v-slot:label
                ><span style="min-width: 145px; display: block"
                  >Khoảng cách dọc</span
                ></template
              >
            </v-slider>
          </v-col>
        </v-row>
      </CustomDialog>
    </div>
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
import CustomDialog from "@/components/CustomDialog.vue";
import PersonInputGroup from "@/components/input/PersonInputGroup.vue";
import PersonCard from "@/components/FamilyCard/PersonCard.vue";
import { getUniqueID } from "@/utils";

export default Vue.extend({
  components: {
    Viewer,
    FamilyCard,
    PersonCard,
    FullViewLoading,
    CustomDialog,
    PersonInputGroup,
  },
  data() {
    const getDefaultConfig = () =>
      ({
        level: 3,
        show: {
          image: true,
          name: true,
          gender: true,
          birthdate: true,
          status: true,
        },
        layout: PersonCardLayout.MIN_HEIGHT,
        horizontalDistance: 120,
        verticalDistance: 150,
      } as FamilyCardConfig);
    return {
      PersonCardLayout,
      viewer: undefined as any,
      key: getUniqueID(),
      ancestor: null as ExtendedPerson | null,
      interval: null as number | null,
      focusSubjectAfterFetched: true,
      // Danh sách person id để focus, ưu tiên cuối
      focusPersonIds: [] as string[],
      disableButtons: false,
      subjectId: null as string | null, // Id của chủ thể biểu đồ gia phả
      config: getDefaultConfig(),

      dialogSetting: false,
      familyTreeLevelItems: [
        {
          text: "Mức 1: Phát triển đầy đủ gia đình các nam, không hiển thị vợ",
          value: 1,
          hint: "Cây gia phả sẽ phát triển đầy đủ cho các nam trong họ, không hiển thị vợ của các nam",
        },
        {
          text: "Mức 2: Phát triển đầy đủ gia đình các nam",
          value: 2,
          hint: "Cây gia phả sẽ phát triển đầy đủ cho các nam trong họ, hiển thị vợ của các nam, không phát triển cho gia đình các nữ",
        },
        {
          text: "Mức 3: Phát triển tối đa tất cả những người có quan hệ",
          value: 3,
          hint: "Cây gia phả sẽ phát triển tối đa tất cả những người có mối quan hệ",
        },
      ],
      settingVModel: {
        ...getDefaultConfig(),
        subjectId: null,
      } as FamilyCardConfig & { subjectId: string | null },
    };
  },
  watch: {
    interval(val, oldVal) {
      if (oldVal) {
        window.l(oldVal);
        clearInterval(oldVal);
      }
    },
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
        personApi.getFamilyTreeInfo({
          level: this.config.level,
          subjectId: this.subjectId || undefined,
        }),
      ]).then(async ([_, familyTreeRespone]) => {
        const { data } = familyTreeRespone;

        if (data.ancestor) {
          this.ancestor = data.ancestor;
          this.key = getUniqueID(); // Force recreate (Thường thì ko hiểu tại sao component ở đây khi set ancestor sẽ bị recreate, nhưng cứ chủ động force cho chắc)

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
          let temp =
            this.focusSubjectAfterFetched && data.subjectId
              ? data.subjectId
              : this.focusPersonIds[this.focusPersonIds.length - 1];
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

          if (data.subjectId) {
            this.focusPersonIds.push(data.subjectId);
          }
        }
      });
    },
    async focusSubject(speed = 8) {
      const familyCard = this.$refs.familyCard as any;
      if (!familyCard) {
        return;
      }

      const personIdToFocus =
        this.focusPersonIds[this.focusPersonIds.length - 1];
      if (!personIdToFocus) {
        return;
      }

      const [targetElement] =
        familyCard.findCardElementByPersonId(personIdToFocus);

      if (targetElement) {
        this.disableButtons = true;
        await (this.$refs.viewer as any).focusElement(
          targetElement,
          speed > 0 ? speed : undefined
        );
        this.disableButtons = false;
      }
    },
    openDialogSetting() {
      this.dialogSetting = true;
      const cf = this.config;
      this.settingVModel = {
        subjectId: this.subjectId || this.$store.state.personStandForUser.id,
        level: cf.level,
        show: {
          image: cf.show.image,
          name: cf.show.name,
          gender: cf.show.gender,
          birthdate: cf.show.birthdate,
          status: cf.show.status,
        },
        layout: cf.layout,
        horizontalDistance: cf.horizontalDistance,
        verticalDistance: cf.verticalDistance,
      };
    },
    async applySetting() {
      const isSubjectChanged =
        (this.subjectId || this.$store.state.personStandForUser.id) !=
        (this.settingVModel.subjectId ||
          this.$store.state.personStandForUser.id);
      const isLevelChanged = this.config.level != this.settingVModel.level;

      const st = this.settingVModel;
      this.subjectId = st.subjectId;
      this.config = {
        level: st.level,
        show: {
          image: st.show.image,
          name: st.show.name,
          gender: st.show.gender,
          birthdate: st.show.birthdate,
          status: st.show.status,
        },
        layout: st.layout,
        horizontalDistance: st.horizontalDistance,
        verticalDistance: st.verticalDistance,
      };

      if (isSubjectChanged || isLevelChanged) {
        this.loadData();
      } else {
        // Force recreate cả viewer lẫn familyCard (Do nếu không recreate sẽ có cực kỳ nhiều lỗi oái oăm của cả viewer lẫn familyCard, mong ngày nào đó mình sẽ fix)
        const ancestor = this.ancestor;
        this.ancestor = null;
        await nextTick();
        this.ancestor = ancestor;
        // Gán này thực ra không cần thiết lắm nhưng cứ gắn cho chắc
        this.key = getUniqueID();

        await nextTick();
        // Resize and reassign viewer, very important
        this.viewer = this.$refs.viewer;
        this.resizeViewer();
        setTimeout(this.resizeViewer, 100);

        this.focusSubject(-1);
      }

      this.dialogSetting = false;
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
