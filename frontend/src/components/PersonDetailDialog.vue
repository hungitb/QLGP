<template>
  <CustomDialog
    v-model="dialog"
    ref="dialog"
    maxWidth="500px"
    buttonText
    xsFullScreen
  >
    <template v-if="person">
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
          <div>
            Giới tính:
            <template v-if="person.gender == Gender.MALE">Nam</template>
            <template v-else>Nữ</template>
          </div>
          <div>
            Ngày sinh:
            <template v-if="person.birthdate">
              {{
                transformDateString(person.birthdate, { showLunarDate: false })
              }}
            </template>
            <template v-else>Không rõ</template>
          </div>
          <div>
            Tình trạng:
            <template v-if="!person.status"> Không rõ </template>
            <template v-else-if="person.status == LifeStatus.ALIVE">
              Còn sống
            </template>
            <template v-else-if="person.status == LifeStatus.DEAD">
              Đã mất
              <template v-if="person.deathdate">
                {{ transformDateString(person.deathdate) }}
              </template>
            </template>
          </div>
        </v-col>

        <v-col cols="12" v-if="editable && canWrite()">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-btn block color="primary" outlined @click="editPerson">
                <v-icon left>mdi-pencil</v-icon>
                Sửa thông tin
              </v-btn>
            </v-col>
            <v-col cols="12" sm="6" v-if="$store.state.idToTien != person.id">
              <v-btn block color="red" outlined @click="deletePerson">
                <v-icon left>mdi-delete</v-icon>
                Xóa thành viên
              </v-btn>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12">
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
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <CustomDialog
      v-model="dialogEditChildOrders"
      header="Chỉnh sửa thứ tự"
      maxWidth="400px"
      buttonText
      noPadding
      persistent
      :isLoading="isSavingNewChildOrders"
      :buttons="[
        {
          text: 'Lưu',
          click: saveNewChildOrders,
        },
      ]"
    >
      <v-list two-line>
        <v-list-item v-for="(id, i) in newChildOrders" :key="id + '-' + i">
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
              $store.state.personMapping[id].gender
            }}</v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <div class="d-flex justify-space-between" style="width: 90px">
              <v-btn
                v-if="i != 0"
                fab
                dark
                small
                color="primary"
                outlined
                @click="moveUpChild(i)"
              >
                <v-icon dark> mdi-arrow-up </v-icon>
              </v-btn>
              <v-spacer
                v-if="i == 0 || i == newChildOrders.length - 1"
              ></v-spacer>
              <v-btn
                v-if="i != newChildOrders.length - 1"
                fab
                dark
                small
                color="primary"
                outlined
                @click="moveDownChild(i)"
              >
                <v-icon dark> mdi-arrow-down </v-icon>
              </v-btn>
            </div>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </CustomDialog>
  </CustomDialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import CustomDialog from "./CustomDialog.vue";
import { personApi } from "@/api/person";
import CustomPersonAvatar from "./CustomPersonAvatar.vue";
import { Person, Gender, LifeStatus } from "../../../backend/src/model/Person";
import { transformDateString } from "../../../backend/src/utils/DateUtils";
import {
  showDialogConfirm,
  showSnackbar,
  showDialogAddOrCreatePerson,
} from "@/components/utilities";
import { mapActions } from "vuex";
import { FETCH_PEOPLE } from "@/store";
import { permissionMixin } from "@/utils";

type PersonDetailInfo = Awaited<
  ReturnType<typeof personApi.getPersonDetailInfo>
>["data"] extends { msg: string } | { person: infer T }
  ? T
  : never;

export default defineComponent({
  components: {
    CustomDialog,
    CustomPersonAvatar,
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
    return {
      Gender,
      LifeStatus,
      internalPersonId: this.personId,
      isLoadingDetailInfo: false,
      personDetailInfo: undefined as PersonDetailInfo | undefined,
      dialogEditChildOrders: false,
      newChildOrders: [] as string[],
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
    dialogEditChildOrders(v) {
      if (v) {
        this.newChildOrders = [...this.personDetailInfo!.childIds];
      }
    },
  },
  methods: {
    ...mapActions([FETCH_PEOPLE]),
    transformDateString,
    refresh() {
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
    moveUpChild(childIdex: number) {
      if (childIdex > 0) {
        const swapElements = [
          this.newChildOrders[childIdex - 1],
          this.newChildOrders[childIdex],
        ];
        this.newChildOrders.splice(
          childIdex - 1,
          2,
          swapElements[1],
          swapElements[0]
        );
      }
    },
    moveDownChild(childIdex: number) {
      if (childIdex < this.newChildOrders.length - 1) {
        const swapElements = [
          this.newChildOrders[childIdex],
          this.newChildOrders[childIdex + 1],
        ];
        this.newChildOrders.splice(
          childIdex,
          2,
          swapElements[1],
          swapElements[0]
        );
      }
    },
    async saveNewChildOrders() {
      this.isSavingNewChildOrders = true;
      await personApi.swapYoungnessLevel({ ids: this.newChildOrders });
      this.isSavingNewChildOrders = false;
      this.dialogEditChildOrders = false;
      this.refresh();
    },
  },
  mounted() {
    this.fetchPersonDetailInfo();
  },
});
</script>
