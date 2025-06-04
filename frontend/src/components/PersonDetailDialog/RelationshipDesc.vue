<template>
  <div>
    <div class="text-h6">{{ $store.state.personMapping[fromId].callname }}</div>
    <template v-if="wayOfCallingTheOther">
      <div>
        Là
        <span class="green--text">{{
          uncapitalize(wayOfCallingTheOther)
        }}</span>
        của
        <span class="primary--text">{{
          $store.state.personMapping[toId].callname
        }}</span
        >.
      </div>
      <div
        v-if="
          relationshipWithTheOtherDesc &&
          relationshipWithTheOtherDesc != wayOfCallingTheOther
        "
      >
        Cụ thể là
        <span class="green--text">{{
          uncapitalize(relationshipWithTheOtherDesc)
        }}</span
        >.
      </div>
    </template>
    <template v-else-if="relationshipWithTheOtherDesc">
      <div>
        Là
        <span class="green--text">{{
          uncapitalize(relationshipWithTheOtherDesc || "")
        }}</span>
        của
        <span class="primary--text">{{
          $store.state.personMapping[toId].callname
        }}</span
        >.
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  props: {
    fromId: {
      type: String,
      required: true,
    },
    toId: {
      type: String,
      required: true,
    },
    wayOfCallingTheOther: {
      type: [String, null] as PropType<string | null>,
    },
    relationshipWithTheOtherDesc: {
      type: [String, null] as PropType<string | null>,
    },
  },
  data() {
    return {
      dividerStyle: {
        height: "2px",
        backgroundColor: "grey",
      },
    };
  },
  methods: {
    uncapitalize(x: string) {
      if (!x) return x;
      return x[0].toLowerCase() + x.slice(1);
    },
  },
});
</script>
