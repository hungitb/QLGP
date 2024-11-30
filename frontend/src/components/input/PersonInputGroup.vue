<template>
  <div>
    <v-autocomplete
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
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import CustomPersonAvatar from "../CustomPersonAvatar.vue";
import { Gender, Person } from "../../../../backend/src/model/Person";

export default Vue.extend({
  components: {
    CustomPersonAvatar,
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
  },
});
</script>
