<template>
  <div id="family-tree" class="d-flex justify-center align-center">
    <div
      v-if="!$store.state.idToTien && !subjectId"
      class="px-4"
      style="max-width: 400px"
    >
      <div class="text-h4 text-center">
        Hiện chưa có tổ tiên để xem cây gia phả
      </div>
      <div class="mt-8 px-8">
        <div class="grey--text mb-2 text-center">
          Chọn một thành viên bất kỳ thay thế để xem cây gia phả của họ
        </div>
        <PersonInputGroup
          v-model="subjectId"
          one
          label="Chủ thể"
        ></PersonInputGroup>
      </div>
    </div>
    <template v-else-if="topLevelPerson && !$store.state.isLoadingPeople">
      <Viewer ref="viewer" :key="key">
        <FamilyCard
          ref="familyCard"
          :person="topLevelPerson"
          :config="config"
          :viewer="viewer"
          @addPersonRelationShipDone="handlePersonAddRelationship"
          :style="{
            paddingBottom: config.verticalDistance + 'px',
          }"
        />
      </Viewer>

      <!-- Hard code position -->
      <div style="position: fixed; right: 12px; bottom: 72px">
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
          class="ml-2"
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
          xsFullScreen
          persistent
        >
          <v-row>
            <v-col cols="12">
              <PersonInputGroup
                label="Chủ thể biểu đồ"
                one
                v-model="settingVModel.subjectId"
                hide-details
              />
            </v-col>

            <v-col cols="12">
              <v-checkbox
                v-model="settingVModel.drawSpouse"
                label="Vẽ bạn đời các thành viên"
                hide-details
                class="mt-2"
              ></v-checkbox>

              <v-checkbox
                v-model="settingVModel.expandNonRelatedFamily"
                :label="`Vẽ gia đình của các thành viên ${
                  $store.state.user.thongTinGiaPha.type == 'phaHe'
                    ? 'Nữ'
                    : 'Nam'
                } trong gia phả`"
                hide-details
                class="mt-2"
              ></v-checkbox>
            </v-col>

            <v-col cols="12" class="mt-8">
              <div class="d-flex flex-column align-center">
                <span class="mb-1">Xem trước</span>
                <PersonCard
                  v-if="subjectId"
                  :person="
                    settingVModel.subjectId
                      ? $store.state.personMapping[settingVModel.subjectId]
                      : $store.state.personMapping[subjectId]
                  "
                  viewOnly
                  :config="settingVModel.personCardConfig"
                />
              </div>
            </v-col>

            <v-col cols="12">
              <span>Thông tin thẻ thành viên</span>
              <v-checkbox
                v-model="
                  settingVModel.personCardConfig.elementsDisplayedDict.image
                "
                hide-details
                label="Ảnh đại diện"
              />
              <v-checkbox
                v-model="
                  settingVModel.personCardConfig.elementsDisplayedDict.name
                "
                hide-details
                label="Tên"
              />
              <v-checkbox
                v-model="
                  settingVModel.personCardConfig.elementsDisplayedDict.gender
                "
                hide-details
                label="Giới tính"
              />
              <v-checkbox
                v-model="
                  settingVModel.personCardConfig.elementsDisplayedDict.birthdate
                "
                hide-details
                label="Ngày sinh"
              />
              <v-checkbox
                v-model="
                  settingVModel.personCardConfig.elementsDisplayedDict.status
                "
                hide-details
                label="Trạng thái, ngày mất (nếu có)"
              />
            </v-col>

            <v-col cols="12">
              <v-radio-group
                label="Bố cục"
                v-model="settingVModel.personCardConfig.layout"
              >
                <v-radio
                  v-for="item in personCardLayoutItems"
                  :key="item.value"
                  :label="item.text"
                  :value="item.value"
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
    </template>

    <FullViewLoading noFloating v-else />
  </div>
</template>

<script lang="ts">
import Vue, { nextTick } from "vue";
import $ from "jquery";

import Viewer from "@/components/Viewer.vue";
import FamilyCard from "@/components/FamilyCard/index";
import FullViewLoading from "@/components/FullViewLoading.vue";
import { personApi } from "@/api/person";
import { FamilyTreePerson } from "../../../backend/src/controller/person";
import { PersonCardConfig, type FamilyCardConfig } from "@/components/types";
import { mapActions } from "vuex";
import { FETCH_PEOPLE } from "@/store";
import CustomDialog from "@/components/CustomDialog.vue";
import PersonInputGroup from "@/components/input/PersonInputGroup.vue";
import PersonCard from "@/components/FamilyCard/PersonCard.vue";
import {
  getFamilyTreeSettingFromLocalStorage,
  getUniqueID,
  saveFamilyTreeToLocalStorage,
} from "@/utils";

const getFamilyCardDefaultConfig = () => {
  const lcConfig = getFamilyTreeSettingFromLocalStorage();

  const config: FamilyCardConfig = {
    drawSpouse: lcConfig.drawSpouse,
    expandNonRelatedFamily: lcConfig.expandNonRelatedFamily,
    personCardConfig: {
      layout: lcConfig.personCardLayoutConfig,
      elementsDisplayedDict: {
        image: true,
        name: true,
        gender: true,
        birthdate: true,
        status: true,
      },
    },
    horizontalDistance: 120,
    verticalDistance: 150,
  };

  return config;
};

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
    const personCardLayoutItems: {
      text: string;
      value: PersonCardConfig["layout"];
    }[] = [
      { text: "Thẻ dọc", value: "VERTICAL" },
      { text: "Thẻ ngang", value: "HORIZONTAL" },
    ];

    return {
      // Dùng để inject vào viewer để check click event
      // Không thể truyền trực tiếp bằng $refs.viewer do đã test
      viewer: undefined as any,
      key: getUniqueID(),
      topLevelPerson: null as FamilyTreePerson | null,
      interval: null as number | null,
      focusSubjectAfterFetched: true,
      // Danh sách person id để focus, ưu tiên cuối
      focusPersonIds: [] as string[],
      disableButtons: false,
      subjectId: this.$store.state.idToTien, // Id của chủ thể biểu đồ gia phả
      config: getFamilyCardDefaultConfig(),

      dialogSetting: false,
      personCardLayoutItems,
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
        ...getFamilyCardDefaultConfig(),
        subjectId: null as string | null,
      },
    };
  },
  watch: {
    interval(val, oldVal) {
      if (oldVal) {
        clearInterval(oldVal);
      }
    },
    subjectId() {
      this.loadData();
    },
    "settingVModel.personCardConfig.elementsDisplayedDict.image"(newValue) {
      if (!newValue) {
        this.settingVModel.personCardConfig.elementsDisplayedDict.name = true;
      }
    },
    "settingVModel.personCardConfig.elementsDisplayedDict.name"(newValue) {
      if (!newValue) {
        this.settingVModel.personCardConfig.elementsDisplayedDict.image = true;
      }
    },
  },
  methods: {
    ...mapActions([FETCH_PEOPLE]),
    resizeViewer() {
      if (!this.$refs.viewer) return;
      const viewer = (this.$refs.viewer as any).$el as HTMLElement;

      const $appBar = $("#app-bar");
      const $bottomNavigation = $("#bottom-navigation");

      viewer.style.width = "100%";
      viewer.style.height =
        window.innerHeight -
        $appBar.height()! -
        $bottomNavigation.height()! +
        "px";
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
      this.topLevelPerson = null; // Nếu không có cái này và FETCH_PEOPLE xong trước thì sẽ xảy ra hiện tượng giật hình
      Promise.all([
        this[FETCH_PEOPLE](),
        personApi.getFamilyTreeInfo({
          subjectId: this.subjectId || undefined,
        }),
      ]).then(async ([_, familyTreeRespone]) => {
        const { data } = familyTreeRespone;

        if (!("topLevelPerson" in data)) {
          return;
        }

        this.topLevelPerson = data.topLevelPerson;
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
        subjectId: this.subjectId,
        drawSpouse: cf.drawSpouse,
        expandNonRelatedFamily: cf.expandNonRelatedFamily,
        personCardConfig: {
          layout: cf.personCardConfig.layout,
          elementsDisplayedDict: {
            ...cf.personCardConfig.elementsDisplayedDict,
          },
        },
        horizontalDistance: cf.horizontalDistance,
        verticalDistance: cf.verticalDistance,
      };
    },
    async applySetting() {
      const isSubjectChanged =
        this.settingVModel.subjectId &&
        this.settingVModel.subjectId != this.subjectId;

      const st = this.settingVModel;
      this.subjectId = st.subjectId || this.subjectId;
      this.config = {
        drawSpouse: st.drawSpouse,
        expandNonRelatedFamily: st.expandNonRelatedFamily,
        personCardConfig: {
          layout: st.personCardConfig.layout,
          elementsDisplayedDict: {
            ...st.personCardConfig.elementsDisplayedDict,
          },
        },
        horizontalDistance: st.horizontalDistance,
        verticalDistance: st.verticalDistance,
      };

      saveFamilyTreeToLocalStorage({
        drawSpouse: st.drawSpouse,
        expandNonRelatedFamily: st.expandNonRelatedFamily,
        personCardLayoutConfig: st.personCardConfig.layout,
      });

      if (isSubjectChanged) {
        this.loadData();
      } else {
        // Force recreate cả viewer lẫn familyCard (Do nếu không recreate sẽ có cực kỳ nhiều lỗi oái oăm của cả viewer lẫn familyCard, mong ngày nào đó mình sẽ fix)
        const topLevelPerson = this.topLevelPerson;
        this.topLevelPerson = null;
        await nextTick();
        this.topLevelPerson = topLevelPerson;
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
    if (this.subjectId) {
      this.loadData();
    }
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
