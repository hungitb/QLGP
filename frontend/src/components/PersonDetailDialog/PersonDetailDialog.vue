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
            <v-col cols="12" sm="9">
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
        <v-col cols="12">
          <v-row v-if="tab == 'GENERAL'">
            <v-col cols="12" md="6">
              <v-card :loading="isLoadingDetailInfo">
                <v-card-title style="word-break: initial">
                  Danh sách người thân
                </v-card-title>
                <v-card-subtitle
                  v-if="!isLoadingDetailInfo && groups.length == 0"
                  style="word-break: initial"
                >
                  Không có thông tin người thân
                </v-card-subtitle>
                <v-list v-else two-line>
                  <template v-for="group in groups">
                    <template v-for="id in group.personIds">
                      <v-divider :key="'divider' + group.text + id"></v-divider>
                      <v-list-item
                        :key="group.text + id"
                        @click="internalPersonId = id"
                      >
                        <v-list-item-avatar>
                          <CustomPersonAvatar
                            :person="$store.state.personMapping[id]"
                            textSize="5"
                          />
                        </v-list-item-avatar>

                        <v-list-item-content>
                          <v-list-item-title>{{
                            $store.state.personMapping[id].callname
                          }}</v-list-item-title>
                          <v-list-item-subtitle>{{
                            group.text
                          }}</v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>
                    </template>
                  </template>
                </v-list>
                <v-card-actions>
                  <v-btn
                    v-if="
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
              :path="personDetailInfo.connectingPathToToTien.map((i) => i.id)"
              :dense="$vuetify.breakpoint.mobile"
            ></Timeline>
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

type PersonDetailInfo = Awaited<
  ReturnType<typeof personApi.getPersonDetailInfo>
>["data"] extends { msg: string } | { person: infer T }
  ? T
  : never;

export default defineComponent({
  components: {
    CustomDialog,
    CustomPersonAvatar,
    ChangeChildrenOrderDialog,
    AdditionalInfo,
    Timeline,
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
    type TabType = "GENERAL" | "TIMELINE" | "RELATIONSHIP_ANLYSIS";

    return {
      genderDisplayText,
      lifeStateDisplayText,
      internalPersonId: this.personId,
      tab: "GENERAL" as TabType,
      tabSelections: [
        { text: "Thông tin chung", value: "GENERAL", icon: "mdi-account" },
        { text: "Dòng thời gian", value: "TIMELINE", icon: "mdi-timeline" },
        {
          text: "Phân tích quan hệ",
          value: "RELATIONSHIP_ANLYSIS",
          icon: "mdi-account-switch",
        },
      ] as { text: string; value: TabType; icon: string }[],
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
    groups() {
      if (!this.personDetailInfo) return [];

      const person = this.personDetailInfo;
      const groups: { text: string; personIds: string[] }[] = [];

      if (person.fatherId) {
        groups.push({
          text: "Bố",
          personIds: [person.fatherId],
        });
      }
      if (person.motherId) {
        groups.push({
          text: "Mẹ",
          personIds: [person.motherId],
        });
      }
      groups.push({
        text: "Anh em ruột",
        personIds: person.personIdsSameBothFatherAndMother,
      });
      groups.push({
        text: "Anh em cùng bố khác mẹ",
        personIds: person.personIdsOnlySameFather,
      });
      groups.push({
        text: "Anh em cùng mẹ khác bố",
        personIds: person.personIdsOnlySameMother,
      });
      if (person.spouseId) {
        groups.push({
          text: "Bạn đời",
          personIds: [person.spouseId],
        });
      }
      groups.push({
        text: "Con ruột",
        personIds: person.childIds,
      });

      return groups.filter(({ personIds }) => personIds.length != 0);
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
