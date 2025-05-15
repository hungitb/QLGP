<template>
  <div id="connecting-line-to-desc-relationship">
    <div v-if="!isUpperLine" :style="dividerStyle"></div>
    <div class="text-center px-4">
      là
      <template v-if="wayOfCallingTheOther">
        <span class="green--text">{{ wayOfCallingTheOther }}</span>
        <template v-if="relationshipWithTheOtherDesc && relationshipWithTheOtherDesc != wayOfCallingTheOther">
          (<span>{{ relationshipWithTheOtherDesc }}</span>)
        </template>
      </template>
      <span v-else>{{ relationshipWithTheOtherDesc }}</span>
      của
    </div>
    <div v-if="isUpperLine" :style="dividerStyle"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  props: {
    wayOfCallingTheOther: {
      type: [String, null] as PropType<string | null>,
    },
    relationshipWithTheOtherDesc: {
      type: [String, null] as PropType<string | null>,
    },
    isUpperLine: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      dividerStyle: {
        height: "2px",
        backgroundColor: "grey"
      }
    };
  }
});
</script>