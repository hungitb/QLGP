<template>
  <div>
    <v-autocomplete
      :label="label"
      outlined
      :items="peopleList"
      item-text="callname"
      item-value="id"
      :multiple="!one"
      v-model="selectedPersonIds"
      :loading="$store.state.isLoadingPeople"
      chips
    >
      <template v-slot:selection="{ selected, attrs, item }">
        <v-chip
          v-bind="attrs"
          :input-value="selected"
          close
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
import { Gender, Person } from "../../../../general/model/Person";

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
    male: {
      type: Boolean,
      default: false,
    },
    female: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    peopleList() {
      const people = this.$store.state.people as Person[];
      return people.filter?.((p) => {
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
  },
});
</script>
