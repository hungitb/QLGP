<template>
  <div
    style="height: 100px; width: 150px; border: 2px solid"
    class="d-flex justify-center align-center"
  >
    {{ person.callname }}
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import { type ExtendedPerson } from "../../../general/controller/person";
import { Person } from "../../../general/model/Person";
import { PersonCardLayout } from "./types";

export default Vue.extend({
  props: {
    person: {
      type: Object as () => ExtendedPerson | Person,
      required: true,
    },
    peopleInfo: {
      type: Object as () => Record<string, Person>,
      required: true,
    },
    layout: {
      type: String as () => PersonCardLayout,
      default: PersonCardLayout.MIN_WIDTH,
    },
  },
});
</script>
