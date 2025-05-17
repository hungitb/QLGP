<template>
  <v-card style="overflow: hidden">
    <CustomPersonAvatar
      :person="person"
      tile
      :size="$vuetify.breakpoint.smAndDown ? 100 : 150"
      :text-size="$vuetify.breakpoint.smAndDown ? '4' : '3'"
    ></CustomPersonAvatar>
    <v-card-title>{{ person.callname }}</v-card-title>
    <v-card-subtitle>{{ genderDisplayText[person.gender] }}</v-card-subtitle>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CustomPersonAvatar from "@/components/CustomPersonAvatar.vue";
import { genderDisplayText, Person } from "../../../../../backend/src/model/Person";

export default defineComponent({
  components: {
    CustomPersonAvatar
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      genderDisplayText
    };
  },
  computed: {
    person() {
      return (this as any).$store.state.personMapping[(this as any).id] as Person;
    }
  },
});
</script>