<template>
  <div>
    <v-autocomplete
      v-if="!isMobile || disabled"
      ref="input"
      :rules="rules"
      :label="label"
      outlined
      :items="peopleList"
      item-text="callname"
      item-value="id"
      :multiple="!one"
      v-model="selectedPersonIds"
      :loading="$store.state.isLoadingPeople"
      validate-on-blur
      chips
      :disabled="disabled"
    >
      <template v-slot:selection="{ selected, attrs, item }">
        <v-chip
          v-bind="attrs"
          :input-value="selected"
          :close="disabled ? undefined : true"
          @click:close="remove(item)"
        >
          <CustomPersonAvatar :person="item" left />
          {{ item.callname }}
        </v-chip>
      </template>

      <template v-slot:item="{ item }">
        <v-list-item-avatar>
          <CustomPersonAvatar :person="item" textSize="5" />
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title v-text="item.callname"></v-list-item-title>
          <v-list-item-subtitle v-text="item.gender"></v-list-item-subtitle>
        </v-list-item-content>
      </template>
    </v-autocomplete>

    <template v-else>
      <v-autocomplete
        ref="input"
        readonly
        :rules="rules"
        :label="label"
        outlined
        :items="peopleList"
        item-text="callname"
        item-value="id"
        :multiple="!one"
        v-model="selectedPersonIds"
        :loading="$store.state.isLoadingPeople"
        validate-on-blur
        chips
        :disabled="disabled"
      >
        <template v-slot:selection="{ selected, attrs, item }">
          <v-chip
            v-bind="attrs"
            :input-value="selected"
            :close="disabled ? undefined : true"
            @click:close="remove(item)"
          >
            <CustomPersonAvatar :person="item" left />
            {{ item.callname }}
          </v-chip>
        </template>

        <template v-slot:append-outer>
          <v-btn outlined text @click.stop="dialogChoosePerson = true">
            Chọn
          </v-btn>
        </template>
      </v-autocomplete>

      <CustomDialog
        v-model="dialogChoosePerson"
        header="Chọn người thân"
        buttonText
        maxWidth="400px"
        :buttons="[{ text: 'Lưu', click: dialogSaveBtnHandler }]"
        bodyHeight="400px"
      >
        <div
          v-if="
            one
              ? dialogChoosePersonSelectedIds
              : dialogChoosePersonSelectedIds.length > 0
          "
          class="mb-4"
        >
          <div class="mb-1">Đã chọn</div>
          <v-chip
            v-for="id in Array.isArray(dialogChoosePersonSelectedIds)
              ? dialogChoosePersonSelectedIds
              : [dialogChoosePersonSelectedIds]"
            :key="id"
            close
            class="mr-2 mb-2"
            @click:close="removeSingleId(id)"
          >
            <CustomPersonAvatar :person="$store.state.personMapping[id]" left />
            {{ $store.state.personMapping[id].callname }}
          </v-chip>
        </div>
        <v-text-field
          v-model="searchPerson"
          dense
          outlined
          label="Tìm kiếm"
          hide-details
          class="mb-2"
        ></v-text-field>

        <span v-if="peopleListAfterFiltered.length <= 0">
          Không có dữ liệu!
        </span>
        <v-list v-else class="mx-n4">
          <v-list-item
            v-for="person in peopleListAfterFiltered"
            :key="person.id"
          >
            <v-list-item-avatar>
              <CustomPersonAvatar :person="person" />
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title>{{ person.callname }}</v-list-item-title>
              <v-list-item-subtitle>{{ person.gender }}</v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action>
              <v-btn
                v-if="one"
                small
                outlined
                @click="handleSingleId(person.id)"
              >
                Chọn
              </v-btn>
              <v-btn v-else icon outlined @click="handleSingleId(person.id)">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </CustomDialog>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import CustomPersonAvatar from "../CustomPersonAvatar.vue";
import CustomDialog from "../CustomDialog.vue";
import { checkIfIsMobile } from "@/utils";
import { Gender, Person } from "../../../../backend/src/model/Person";

function copy(x: any) {
  if (Array.isArray(x)) return [...x];
  return x;
}

export default defineComponent({
  components: {
    CustomPersonAvatar,
    CustomDialog,
  },
  props: {
    value: {
      // type: Object as () => string[] | string | null,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    one: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
    male: {
      type: Boolean,
      default: false,
    },
    female: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    skipPeopleHasRelationshipWith: {
      // type: Object as () => Person,
      default: null,
    },
    exceptionIds: {
      type: Array as () => string[],
      default: () => [],
    },
  },
  data() {
    return {
      isMobile: checkIfIsMobile(),
      dialogChoosePerson: false,
      dialogChoosePersonSelectedIds: copy(this.value) as
        | string[]
        | string
        | null,
      searchPerson: "",
    };
  },
  computed: {
    rules() {
      if (!this.one) {
        return [];
      }
      if (this.required) {
        return [(v: any) => !!v || "Không được để trống"];
      }
      return [];
    },
    peopleList() {
      const people = this.$store.state.people as Person[];
      const exceptionIds = new Set(this.exceptionIds);
      if (this.skipPeopleHasRelationshipWith) {
        const person = this.skipPeopleHasRelationshipWith as Person;
        exceptionIds.add(person.id);
        if (person.spouseId) exceptionIds.add(person.spouseId);
        if (person.fatherId) exceptionIds.add(person.fatherId);
        if (person.motherId) exceptionIds.add(person.motherId);

        // Ở đây sẽ tạm thời không bỏ qua các con nữa do nếu bỏ qua có thể làm việc sửa bị khó
        // people.forEach((p) => {
        //   if (p.fatherId == person.id || p.motherId == person.id) {
        //     exceptionIds.add(p.id);
        //   }
        // });
      }
      return people.filter?.((p) => {
        if (exceptionIds.has(p.id)) return false;
        if (this.male) {
          return p.gender == Gender.MALE;
        }
        if (this.female) {
          return p.gender == Gender.FEMALE;
        }
        return true;
      });
    },
    selectedPersonIds: {
      get() {
        return (this as any).value;
      },
      set(value: any) {
        (this as any).$emit("input", value);
      },
    } as unknown as () => string[] | string | null,
    peopleListAfterFiltered() {
      const search = (this as any).searchPerson.trim().toLowerCase();
      const exceptionIds = new Set<string>();
      if (this.dialogChoosePersonSelectedIds) {
        (Array.isArray(this.dialogChoosePersonSelectedIds)
          ? this.dialogChoosePersonSelectedIds
          : [this.dialogChoosePersonSelectedIds]
        ).forEach((id) => {
          exceptionIds.add(id);
        });
      }
      return (this.peopleList as unknown as Person[]).filter((p) => {
        if (exceptionIds.has(p.id)) return false;
        return p.callname.toLowerCase().includes(search);
      });
    },
  },
  watch: {
    dialogChoosePerson(v) {
      if (!v) (this as any).dialogChoosePersonSelectedIds = this.value as any;
    },
    value(v) {
      this.dialogChoosePersonSelectedIds = copy(v);
    },
  },
  methods: {
    remove(item: Person) {
      if (this.one) {
        this.selectedPersonIds = null;
        return;
      }
      if (this.selectedPersonIds && Array.isArray(this.selectedPersonIds)) {
        this.selectedPersonIds = this.selectedPersonIds.filter(
          (v: string) => v != item.id
        );
      }
    },
    validate() {
      return (this.$refs.input as any).validate();
    },
    resetValidation() {
      return (this.$refs.input as any).resetValidation();
    },

    // For mobile
    removeSingleId(id: string) {
      if (this.one) {
        this.dialogChoosePersonSelectedIds = null;
        return;
      }
      if (Array.isArray(this.dialogChoosePersonSelectedIds)) {
        this.dialogChoosePersonSelectedIds =
          this.dialogChoosePersonSelectedIds.filter((id2) => id2 != id);
      }
    },
    handleSingleId(id: string) {
      if (this.one) {
        this.dialogChoosePersonSelectedIds = id;
        return;
      }
      if (Array.isArray(this.dialogChoosePersonSelectedIds)) {
        this.dialogChoosePersonSelectedIds.push(id);
      }
    },
    dialogSaveBtnHandler() {
      this.selectedPersonIds = copy(this.dialogChoosePersonSelectedIds);
      this.dialogChoosePerson = false;
    },
  },
});
</script>
