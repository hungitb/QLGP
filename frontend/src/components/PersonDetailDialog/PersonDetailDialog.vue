<template>
  <CustomDialog
    v-model="dialog"
    ref="dialog"
    maxWidth="840px"
    buttonText
    xsFullScreen
  >
    <template v-if="person">
      <v-row>
        <v-col cols="12">
          <v-row>
            <v-col cols="12" sm="3" class="d-flex justify-center">
              <CustomPersonAvatar
                :person="person"
                size="100"
                textSize="2"
                viewable
              />
            </v-col>
            <v-col cols="12" sm="9" style="min-height: 150px">
              <div class="text-h5">{{ person.callname }}</div>
              <div>Giới tính: {{ genderDisplayText[person.gender] }}</div>
              <div>
                Ngày sinh:
                <template v-if="person.birthdate">
                  {{
                    transformDateString(person.birthdate, {
                      showLunarDate: false,
                    })
                  }}
                </template>
                <template v-else>Không rõ</template>
              </div>
              <div>
                Tình trạng:
                <template v-if="person.status != 'DEAD'">{{
                  lifeStateDisplayText[person.status]
                }}</template>
                <template v-else>
                  {{ lifeStateDisplayText[person.status] }}
                  <template v-if="person.deathdate">
                    {{ transformDateString(person.deathdate) }}
                  </template>
                </template>
              </div>
              <template v-if="personDetailInfo">
                <template v-if="personDetailInfo.thuocGiaPha">
                  <div v-if="personDetailInfo.doiThu">
                    Đời thứ {{ personDetailInfo.doiThu }}
                  </div>
                </template>
                <template v-else>
                  <div>Không thuộc gia phả</div>
                </template>
              </template>
            </v-col>

            <v-col cols="12" v-if="editable && canWrite()">
              <v-row dense>
                <v-col>
                  <v-btn block color="primary" outlined @click="editPerson">
                    <v-icon left>mdi-pencil</v-icon>
                    Sửa thông tin
                  </v-btn>
                </v-col>
                <v-col v-if="$store.state.idToTien != person.id">
                  <v-btn block color="red" outlined @click="deletePerson">
                    <v-icon left>mdi-delete</v-icon>
                    Xóa thành viên
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>

            <v-col cols="12">
              <div class="py-1" style="overflow-x: auto; white-space: nowrap">
                <template v-for="(item, i) in tabSelections">
                  <v-chip
                    v-if="
                      item.value != 'TIMELINE' ||
                      personDetailInfo?.connectingPathToToTien
                    "
                    :key="item.value"
                    @click="tab = item.value"
                    :color="tab == item.value ? 'primary' : undefined"
                    :class="i != 0 ? 'ml-3' : ''"
                    label
                  >
                    <v-icon left>{{ item.icon }}</v-icon>
                    {{ item.text }}
                  </v-chip>
                </template>
              </div>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="12" style="min-height: 400px">
          <v-row v-if="tab == 'GENERAL'">
            <v-col cols="12" md="6">
              <v-card :loading="isLoadingDetailInfo">
                <v-card-title style="word-break: initial">
                  Người thân
                </v-card-title>
                <v-tabs v-model="generalTabSubTab" fixed-tabs>
                  <v-tab
                    v-for="item in generalTabSubTabSelections"
                    :key="item.value"
                    :tab-value="item.value"
                    >{{ item.text }}</v-tab
                  >
                </v-tabs>
                <v-tabs-items v-model="generalTabSubTab" class="mt-2">
                  <v-tab-item
                    v-for="itemSelection in generalTabSubTabSelections"
                    :key="itemSelection.value"
                    :value="itemSelection.value"
                  >
                    <div style="max-height: 360px; overflow-y: auto">
                      <v-card-text
                        v-if="
                          listedPeopleInGeneralTabSubTab(itemSelection.value)
                            .length == 0
                        "
                      >
                        Không có thông tin
                      </v-card-text>
                      <template v-else>
                        <div
                          v-for="item in listedPeopleInGeneralTabSubTab(
                            itemSelection.value
                          )"
                          :key="item.personId"
                        >
                          <v-list-item
                            @click="internalPersonId = item.personId"
                          >
                            <v-list-item-avatar>
                              <CustomPersonAvatar
                                :person="get(item.personId)"
                                textSize="5"
                              />
                            </v-list-item-avatar>

                            <v-list-item-content>
                              <v-list-item-title>{{
                                get(item.personId).callname
                              }}</v-list-item-title>
                              <v-list-item-subtitle>{{
                                item.relationship
                              }}</v-list-item-subtitle>
                            </v-list-item-content>
                          </v-list-item>
                        </div>
                      </template>
                    </div>
                    <v-card-actions>
                      <v-btn
                        v-if="
                          itemSelection.value == 'GIA_DINH' &&
                          personDetailInfo &&
                          personDetailInfo.childIds.length > 1 &&
                          canWrite() &&
                          editable
                        "
                        text
                        color="primary"
                        @click="dialogEditChildOrders = true"
                      >
                        <v-icon left>mdi-swap-vertical</v-icon>
                        Sửa thứ tự con
                        <ChangeChildrenOrderDialog
                          v-model="dialogEditChildOrders"
                          :child-ids="personDetailInfo.childIds"
                          @newChildOrdersSaved="newChildOrdersSavedHandler"
                        />
                      </v-btn>
                    </v-card-actions>
                  </v-tab-item>
                </v-tabs-items>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <AdditionalInfo
                :data="personDetailInfo?.additionalData"
                :readonly="!editable"
                @addOrUpdateField="refresh"
                @someFieldValsChange="refresh"
              />
            </v-col>
          </v-row>
          <div v-if="tab == 'TIMELINE'">
            <Timeline
              v-if="personDetailInfo && personDetailInfo.connectingPathToToTien"
              :path="personDetailInfo.connectingPathToToTien"
              :dense="$vuetify.breakpoint.mobile"
            >
              <template v-slot:info="{ idx }">
                <template v-if="idx == 0">Tổ tiên</template>
                <template v-else>Đời thứ {{ idx + 1 }}</template>
              </template>
            </Timeline>
          </div>
          <div v-if="tab == 'RELATIONSHIP_ANLYSIS'">
            <RelationshipAnalysis :person-id="person.id"></RelationshipAnalysis>
          </div>
        </v-col>
      </v-row>
    </template>
  </CustomDialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { personApi } from "@/api/person";
import CustomPersonAvatar from "../CustomPersonAvatar.vue";
import {
  Person,
  Gender,
  genderDisplayText,
  lifeStateDisplayText,
  QuanHeTrucTiep,
  ALL_QUAN_HE_TRUC_TIEP_INFO,
} from "../../../../backend/src/model/Person";
import {
  showDialogConfirm,
  showSnackbar,
  showDialogAddOrCreatePerson,
} from "@/components/utilities";
import { mapActions } from "vuex";
import { FETCH_PEOPLE } from "@/store";
import { permissionMixin } from "@/utils";
import { transformDateString } from "../../../../backend/src/utils/DateUtils";
import ChangeChildrenOrderDialog from "./ChangeChildrenOrderDialog.vue";
import AdditionalInfo from "./AdditionalInfo.vue";
import CustomDialog from "../CustomDialog.vue";
import Timeline from "./Timeline.vue";
import RelationshipAnalysis from "./RelationshipAnalysis.vue";

type PersonDetailInfo = Awaited<
  ReturnType<typeof personApi.getPersonDetailInfo>
>["data"] extends { msg: string } | { person: infer T }
  ? T
  : never;
type TabType = "GENERAL" | "TIMELINE" | "RELATIONSHIP_ANLYSIS";
type GeneralTabSubTabType = "GIA_DINH" | "BO_ME" | "HO_HANG";

export default defineComponent({
  components: {
    CustomDialog,
    CustomPersonAvatar,
    ChangeChildrenOrderDialog,
    AdditionalInfo,
    Timeline,
    RelationshipAnalysis,
  },
  mixins: [permissionMixin],
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    personId: {
      type: String,
      default: "",
    },
    editable: {
      type: Boolean,
      default: false,
    },
    onPersonDeleted: {
      type: Function,
    },
    onPersonEdited: {
      type: Function,
    },
  },
  data() {
    const tabSelections: { text: string; value: TabType; icon: string }[] = [
      { text: "Thông tin chung", value: "GENERAL", icon: "mdi-account" },
      { text: "Dòng thời gian", value: "TIMELINE", icon: "mdi-timeline" },
      {
        text: "Phân tích quan hệ",
        value: "RELATIONSHIP_ANLYSIS",
        icon: "mdi-account-switch",
      },
    ];

    const generalTabSubTabSelections: {
      text: string;
      value: GeneralTabSubTabType;
    }[] = [
      { text: "Gia đình", value: "GIA_DINH" },
      { text: "Bố mẹ", value: "BO_ME" },
      { text: "Khác", value: "HO_HANG" },
    ];

    return {
      genderDisplayText,
      lifeStateDisplayText,
      internalPersonId: this.personId,
      tab: "GENERAL" as TabType,
      tabSelections,
      generalTabSubTab: "GIA_DINH" as GeneralTabSubTabType,
      generalTabSubTabSelections,
      isLoadingDetailInfo: false,
      personDetailInfo: undefined as PersonDetailInfo | undefined,
      dialogEditChildOrders: false,
      isSavingNewChildOrders: false,
    };
  },
  computed: {
    dialog: {
      get() {
        return (this as any).value;
      },
      set(val: any) {
        (this as any).$emit("input", val);
      },
    } as unknown as () => boolean,
    person() {
      return (this as any).$store.state.personMapping[
        (this as any).internalPersonId
      ] as Person | null;
    },
    familyMembers() {
      if (!this.personDetailInfo) return [];

      const result: { personId: string; relationship: string }[] = [];

      const person = this.personDetailInfo;
      if (person.spouseId) {
        const spouse = this.get(person.spouseId);
        var relationship: string;
        if (person.gender == spouse.gender) {
          relationship = "Bạn đời";
        } else {
          if (spouse.gender == "MALE") {
            relationship = "Chồng";
          } else {
            relationship = "Vợ";
          }
        }
        result.push({ personId: person.spouseId, relationship });
      }
      person.childIds.forEach((id) => {
        const child = this.get(id);
        result.push({
          personId: id,
          relationship: child.gender == "MALE" ? "Con trai" : "Con gái",
        });
      });

      return result;
    },
    parentFamilyMembers() {
      const personDetailInfo: PersonDetailInfo | undefined = (this as any)
        .personDetailInfo;
      if (!personDetailInfo) return [];

      const typesBoMe: QuanHeTrucTiep[] = ["Bo", "Me"];
      const typesAnhChiEm: QuanHeTrucTiep[] = [
        "AnhTrai",
        "ChiGai",
        "EmTrai",
        "EmGai",
      ];

      const boMe: { id: string; type: QuanHeTrucTiep }[] = [];
      const anhEm: { id: string; type: QuanHeTrucTiep }[] = [];

      const existedInFamilyMembers = new Set(
        this.familyMembers.map((o) => o.personId)
      );

      personDetailInfo.peopleHasQuanHeTrucTiep.forEach((p) => {
        if (existedInFamilyMembers.has(p.id)) {
          return;
        }

        if (typesBoMe.includes(p.type)) {
          boMe.push(p);
        } else if (typesAnhChiEm.includes(p.type)) {
          anhEm.push(p);
        }
      });

      const result = [
        ...boMe,
        ...anhEm.sort(({ id: id1 }, { id: id2 }) => {
          return (
            (this as any).$store.state.personMapping[id1].youngnessLevel -
            (this as any).$store.state.personMapping[id2].youngnessLevel
          );
        }),
      ];

      return result.map(({ id, type }) => ({
        personId: id,
        relationship: ALL_QUAN_HE_TRUC_TIEP_INFO[type].desc,
      }));
    },
    relativePeople(): { personId: string; relationship: string }[] {
      const personDetailInfo: PersonDetailInfo | undefined = (this as any)
        .personDetailInfo;
      if (!personDetailInfo) return [];

      const existedInFamilyMembers = new Set<string>([
        ...(this as any).familyMembers.map((o) => o.personId),
        ...(this as any).parentFamilyMembers.map((o) => o.personId),
      ]);

      return personDetailInfo.peopleHasQuanHeTrucTiep
        .filter((p) => !existedInFamilyMembers.has(p.id))
        .filter((p) => ALL_QUAN_HE_TRUC_TIEP_INFO[p.type].closeness <= 3)
        .filter((p) => ALL_QUAN_HE_TRUC_TIEP_INFO[p.type].wayOfCalling)
        .sort((p1, p2) => {
          return (
            ALL_QUAN_HE_TRUC_TIEP_INFO[p1.type].closeness -
            ALL_QUAN_HE_TRUC_TIEP_INFO[p2.type].closeness
          );
        })
        .map((p) => {
          var relationship: string;
          const wayOfCalling = ALL_QUAN_HE_TRUC_TIEP_INFO[p.type].wayOfCalling!;

          if (typeof wayOfCalling == "string") {
            relationship = wayOfCalling;
          } else if (typeof wayOfCalling == "function") {
            relationship = wayOfCalling(
              (this as any).$store.state.personMapping[p.id]
            );
          } else {
            relationship = "";
          }

          return {
            personId: p.id,
            relationship: `${relationship} / ${
              ALL_QUAN_HE_TRUC_TIEP_INFO[p.type].desc
            }`,
          };
        });
    },
  },
  watch: {
    personId(val) {
      this.internalPersonId = val;
    },
    internalPersonId() {
      this.refresh();
    },
  },
  methods: {
    ...mapActions([FETCH_PEOPLE]),
    transformDateString,
    get(personId: string) {
      return this.$store.state.personMapping[personId];
    },
    refresh() {
      this.tab = "GENERAL";
      (this.$refs.dialog as any).scrollTop();
      this.fetchPersonDetailInfo();
    },
    async fetchPersonDetailInfo() {
      if (!this.internalPersonId) return;
      this.isLoadingDetailInfo = true;
      this.personDetailInfo = undefined;
      const { data } = await personApi.getPersonDetailInfo({
        id: this.internalPersonId,
      });
      this.isLoadingDetailInfo = false;

      if (!("person" in data)) return;

      this.personDetailInfo = data.person;
    },
    listedPeopleInGeneralTabSubTab(tab: GeneralTabSubTabType) {
      if (tab == "GIA_DINH") {
        return this.familyMembers;
      } else if (tab == "BO_ME") {
        return this.parentFamilyMembers;
      } else if (tab == "HO_HANG") {
        return this.relativePeople;
      } else {
        const x: never = tab;
        return [];
      }
    },
    editPerson() {
      if (!this.person) {
        return;
      }
      const onDone = () => {
        this.refresh();
      };
      showDialogAddOrCreatePerson({
        person: this.person,
        onDone,
      });
    },
    deletePerson() {
      if (!this.person) {
        return;
      }
      const person = this.person;
      const onConfirmed = async () => {
        await personApi.deletePerson({ id: person.id }).then(() => {
          (this as any)[FETCH_PEOPLE]();
        });
        showSnackbar({ msg: `Xóa ${person.callname} thành công` });
        if (this.onPersonDeleted) {
          this.onPersonDeleted();
        }

        this.dialog = false;
      };
      showDialogConfirm({
        onConfirmed,
        header: `Bạn có chắc chắn muốn xóa ${person.callname} không?`,
        info: "Nếu xóa người này, mối quan hệ của những người liên quan với người này sẽ bị xóa",
        confirmText: "Xóa",
        confirmColor: "error",
      });
    },
    newChildOrdersSavedHandler() {
      this.dialogEditChildOrders = false;
      this.refresh();
    },
  },
  mounted() {
    this.fetchPersonDetailInfo();
  },
});
</script>
