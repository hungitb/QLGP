<template>
  <div>
    <v-autocomplete
      :label="label"
      outlined
      :loading="isLoadingPeopleList"
      :items="peopleList"
      item-text="callname"
      item-value="id"
      :multiple="!one"
      v-model="selectedPersonIds"
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
import Vue, { PropType } from "vue";

import CustomPersonAvatar from "../CustomPersonAvatar.vue";
import { personApi } from "@/api/person";
import { Gender, Person } from "../../../../general/model/Person";

export default Vue.extend({
  components: {
    CustomPersonAvatar,
  },
  props: {
    value: {
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
  data() {
    return {
      isLoadingPeopleList: true,
      peopleList: [],
    };
  },
  computed: {
    selectedPersonIds: {
      get() {
        return (this as any).value;
      },
      set(value) {
        (this as any).$emit("input", value);
      },
    },
  },
  methods: {
    remove(item: Person) {
      if (this.one) {
        this.selectedPersonIds = null;
        return;
      }
      this.selectedPersonIds = this.selectedPersonIds.filter(
        (v: string) => v != item.id
      );
    },
  },
  mounted() {
    personApi.getAllPeopleBaseInfo().then(({ data, status }) => {
      (this as any).isLoadingPeopleList = false;

      (this as any).peopleList = data.people?.filter?.((p) => {
        if (this.male) {
          return p.gender == Gender.MALE;
        }
        if (this.female) {
          return p.gender == Gender.FEMALE;
        }
        return true;
      });
    });
  },
});
</script>
