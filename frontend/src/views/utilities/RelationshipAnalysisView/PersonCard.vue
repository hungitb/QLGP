<template>
  <div class="elevation-1" :style="{ width: `${width}px`, overflow: 'hidden' }">
    <CustomPersonAvatar
      :person="person"
      tile
      :size="width"
      :text-size="'4'"
    ></CustomPersonAvatar>
    <div class="pa-2">
      <div class="text-h6 text-center">{{ person.callname }}</div>
      <div class="text-center">{{ genderDisplayText[person.gender] }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CustomPersonAvatar from "@/components/CustomPersonAvatar.vue";
import {
  genderDisplayText,
  Person,
} from "../../../../../backend/src/model/Person";

export default defineComponent({
  components: {
    CustomPersonAvatar,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      genderDisplayText,
    };
  },
  computed: {
    person() {
      return (this as any).$store.state.personMapping[
        (this as any).id
      ] as Person;
    },
    width() {
      return 100;
      // return (this as any).$vuetify.breakpoint.smAndDown ? 100 : 150;
    },
  },
});
</script>
