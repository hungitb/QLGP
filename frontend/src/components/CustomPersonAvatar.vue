<template>
  <v-avatar
    :size="size"
    :color="person.gender != Gender.MALE ? 'pink' : 'primary'"
    :left="left"
    :tile="tile"
  >
    <v-img
      v-if="person.avatarUrl"
      :src="person.avatarUrl"
      :alt="person.callname"
    />

    <span
      v-else-if="person.callname.trim()"
      :class="
        textSize
          ? `text-h${textSize} font-weight-light white--text`
          : `white--text`
      "
    >
      {{ person.callname.trim().split(" ").at(-1).charAt(0).toUpperCase() }}
    </span>

    <v-icon dark v-else large>
      {{
        person.gender != Gender.MALE
          ? "mdi-account-tie-woman"
          : "mdi-account-tie"
      }}
    </v-icon>
  </v-avatar>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";

import { Gender } from "../../../backend/src/model/Person";

export default Vue.extend({
  props: {
    person: {
      type: Object as () => {
        gender: Gender;
        avatarUrl: string | null;
        callname: string;
      },
      required: true,
    },
    size: {
      type: [String, Number] as PropType<string | number | undefined>,
      default: undefined,
    },
    textSize: {
      type: String,
      default: null,
    },
    left: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
    tile: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
  },
  data() {
    return {
      Gender,
    };
  },
});
</script>
