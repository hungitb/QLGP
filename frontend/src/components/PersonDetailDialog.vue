<template>
  <CustomDialog v-model="dialog" ref="dialog" maxWidth="500px" buttonText xsFullScreen>
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

        <v-col cols="12" v-if="editable">
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
              Người liên quan
            </v-card-title>
            <v-card-subtitle
              v-if="!isLoadingDetailInfo && groups.length == 0"
              style="word-break: initial"
            >
              Không có người thân liên quan
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
          </v-card>
        </v-col>
      </v-row>
    </template>
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

export default defineComponent({
  components: {
    CustomDialog,
    CustomPersonAvatar,
  },
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
      groups: [] as { text: string; personIds: string[] }[],
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
      this.groups = [];
      (this.$refs.dialog as any).scrollTop();
      this.fetchPersonDetailInfo();
    },
    async fetchPersonDetailInfo() {
      if (!this.internalPersonId) return;
      this.isLoadingDetailInfo = true;
      const { data } = await personApi.getPersonDetailInfo({
        id: this.internalPersonId,
      });
      this.isLoadingDetailInfo = false;

      if (!("person" in data)) return;

      const person = data.person;
      if (!person) return;

      if (person.fatherId) {
        this.groups.push({
          text: "Bố",
          personIds: [person.fatherId],
        });
      }
      if (person.motherId) {
        this.groups.push({
          text: "Mẹ",
          personIds: [person.motherId],
        });
      }
      this.groups.push({
        text: "Anh em ruột",
        personIds: person.personIdsSameBothFatherAndMother,
      });
      this.groups.push({
        text: "Anh em cùng bố khác mẹ",
        personIds: person.personIdsOnlySameFather,
      });
      this.groups.push({
        text: "Anh em cùng mẹ khác bố",
        personIds: person.personIdsOnlySameMother,
      });
      if (person.spouseId) {
        this.groups.push({
          text: "Bạn đời",
          personIds: [person.spouseId],
        });
      }
      this.groups.push({
        text: "Con ruột",
        personIds: person.childIds,
      });

      this.groups = this.groups.filter(
        ({ personIds }) => personIds.length != 0
      );
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
          this[FETCH_PEOPLE]();
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
  },
  mounted() {
    this.fetchPersonDetailInfo();
  },
});
</script>
