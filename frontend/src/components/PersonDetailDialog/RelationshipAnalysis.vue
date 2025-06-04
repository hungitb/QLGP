<template>
  <div>
    <div style="max-width: 500px">
      <PersonInputGroup
        v-model="targetPersonId"
        one
        :exception-ids="[personId]"
        label="Người cần phân tích"
        hide-details
      ></PersonInputGroup>
    </div>
    <div v-if="relationship !== undefined">
      <div v-if="relationship">
        <div v-if="relationship.relationshipDetailDesc" class="mt-6">
          <div class="text-h6">Mối quan hệ</div>
          <div
            v-html="
              relationshipDetailDescHtml(relationship.relationshipDetailDesc)
            "
          ></div>
        </div>
        <div
          v-if="
            relationship.p2.wayOfCallingTheOther ||
            relationship.p2.relationshipWithTheOtherDesc
          "
          class="mt-6"
        >
          <RelationshipDesc
            :fromId="personId"
            :toId="targetPersonId"
            :wayOfCallingTheOther="relationship.p2.wayOfCallingTheOther"
            :relationshipWithTheOtherDesc="
              relationship.p2.relationshipWithTheOtherDesc
            "
          ></RelationshipDesc>
        </div>
        <div
          v-if="
            relationship.p1.wayOfCallingTheOther ||
            relationship.p1.relationshipWithTheOtherDesc
          "
          class="mt-6"
        >
          <RelationshipDesc
            :fromId="targetPersonId"
            :toId="personId"
            :wayOfCallingTheOther="relationship.p1.wayOfCallingTheOther"
            :relationshipWithTheOtherDesc="
              relationship.p1.relationshipWithTheOtherDesc
            "
          ></RelationshipDesc>
        </div>
      </div>
      <div v-else>
        <div v-if="targetPerson" class="mt-6">
          Không rõ mối quan hệ giữa {{ person.callname }} và
          {{ targetPerson.callname }}.
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PersonInputGroup from "../input/PersonInputGroup.vue";
import { RelationshipAnalysisResult } from "../../../../backend/src/model/Person";
import { personApi } from "@/api/person";
import RelationshipDesc from "./RelationshipDesc.vue";

export default defineComponent({
  components: {
    PersonInputGroup,
    RelationshipDesc,
  },
  props: {
    personId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      targetPersonId: null as string | null,
      relationship: undefined as RelationshipAnalysisResult | null | undefined,
    };
  },
  computed: {
    person() {
      return this.$store.state.personMapping[this.personId];
    },
    targetPerson() {
      if (!this.targetPersonId) return null;
      return this.$store.state.personMapping[this.targetPersonId];
    },
  },
  watch: {
    personId() {
      this.fetchData();
    },
    targetPersonId() {
      this.fetchData();
    },
  },
  methods: {
    async fetchData() {
      this.relationship = undefined;

      if (!this.targetPersonId) {
        return;
      }

      const { data } = await personApi.analyzeRelationship({
        id1: this.personId,
        id2: this.targetPersonId,
      });

      if ("data" in data) {
        this.relationship = data.data;
      } else {
        this.relationship = null;
      }
    },
    splitRelationshipDetailDesc(desc: string) {
      const regex = /\$person{id=([\s\S]*?),\s*\{\{([\s\S]*?)\}\}}/g;
      const result: (
        | { type: "text"; value: string }
        | { type: "person"; id: string; value: string }
      )[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null = null;

      while ((match = regex.exec(desc)) !== null) {
        const matchStart = match.index;

        if (matchStart > lastIndex) {
          result.push({
            type: "text",
            value: desc.slice(lastIndex, matchStart),
          });
        }

        result.push({
          type: "person",
          id: match[1].trim(),
          value: match[2].trim(),
        });

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < desc.length) {
        result.push({
          type: "text",
          value: desc.slice(lastIndex),
        });
      }

      return result;
    },
    relationshipDetailDescHtml(desc: string) {
      const parts = this.splitRelationshipDetailDesc(desc);
      return (
        parts
          .map((p) => {
            if (p.type == "text") {
              return p.value;
            } else if (p.type == "person") {
              return `<span class="primary--text">${p.value}</span>`;
            } else {
              const x: never = p;
            }
            return "";
          })
          .join("") + "."
      );
    },
  },
});
</script>
