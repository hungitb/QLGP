<template>
  <v-avatar
    :size="size"
    :color="defaultBgColorMapping[person.gender]"
    :left="left"
    :tile="tile"
  >
    <v-img
      v-if="person.avatarUrl"
      :src="person.avatarUrl"
      :alt="person.callname"
      @click="handleClick"
      :style="viewable ? { cursor: 'pointer' } : {}"
    />

    <span
      v-else-if="person.callname.trim()"
      :class="
        textSize
          ? `text-h${textSize} font-weight-light white--text`
          : `white--text`
      "
    >
      {{ firstCharacterOfName }}
    </span>

    <v-icon dark v-else large>
      {{
        person.gender != "MALE" ? "mdi-account-tie-woman" : "mdi-account-tie"
      }}
    </v-icon>
  </v-avatar>
</template>

<script lang="ts">
import { PropType, defineComponent } from "vue";

import { showImage } from "../components/utilities/ShowImage.vue";
import { Gender } from "../../../backend/src/model/Person";

export default defineComponent({
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
    viewable: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      defaultBgColorMapping: {
        MALE: "primary",
        FEMALE: "pink",
      } as Record<Gender, string>,
    };
  },
  computed: {
    firstCharacterOfName() {
      const lastname = (this as any).person.callname.trim().split(" ").at(-1);
      if (!lastname) return "";
      return lastname.charAt(0).toUpperCase();
    },
  },
  methods: {
    handleClick(e: any) {
      if (!this.viewable) return;
      e.preventDefault();
      if (this.person.avatarUrl) {
        showImage({ src: this.person.avatarUrl });
      }
    },
  },
});
</script>
