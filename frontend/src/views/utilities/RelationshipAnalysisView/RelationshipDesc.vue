<template>
  <div class="d-flex">
    <div>
      <PersonCard :id="fromId" />
    </div>
    <div class="d-flex flex-column justify-space-around" style="flex: 1">
      <div id="connecting-line-to-desc-relationship">
        <div class="text-center px-4">
          là
          <template v-if="wayOfCallingTheOther">
            <span class="green--text">{{ wayOfCallingTheOther }}</span>
            <template
              v-if="
                relationshipWithTheOtherDesc &&
                relationshipWithTheOtherDesc != wayOfCallingTheOther
              "
            >
              (<span>{{ uncapitalie(relationshipWithTheOtherDesc) }}</span
              >)
            </template>
          </template>
          <span v-else>{{
            uncapitalie(relationshipWithTheOtherDesc || "")
          }}</span>
          của
        </div>
        <div :style="dividerStyle"></div>
      </div>
    </div>
    <div>
      <PersonCard :id="toId" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import PersonCard from "./PersonCard.vue";

export default defineComponent({
  components: {
    PersonCard,
  },
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
    uncapitalie(x: string) {
      if (!x) return x;
      return x[0].toLowerCase() + x.slice(1);
    },
  },
});
</script>
