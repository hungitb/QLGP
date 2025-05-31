<template>
  <div>
    <v-row>
      <v-col cols="12" md="6">
        <PersonInputGroup
          v-model="id1"
          label="Thành viên 1"
          one
          :exception-ids="id2 ? [id2] : []"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="6">
        <PersonInputGroup
          v-model="id2"
          label="Thành viên 2"
          one
          :exception-ids="id1 ? [id1] : []"
          hide-details
        />
      </v-col>
    </v-row>

    <div v-if="relationship === null" class="text-center text-h5 mt-8">
      Không rõ mối quan hệ giữa hai người này
    </div>

    <div v-if="!isLoading && id1 && id2 && relationship" class="mt-8 pb-8">
      <div>
        <div class="mx-auto" style="max-width: max(30%, 600px)">
          <div v-if="relationship.relationshipDetailDesc" class="mb-8">
            <div class="text-center px-4 text-h5">
              <template
                v-for="(g, i) in splitRelationshipDetailDesc(
                  relationship.relationshipDetailDesc
                )"
              >
                <span v-if="g.type == 'text'" :key="i">{{ g.value }}</span>
                <span
                  v-else
                  @click="showPersonDetailInfo(g.id)"
                  class="green--text"
                  style="cursor: pointer"
                  :key="i"
                >
                  {{ g.value }}
                </span>
              </template>.
            </div>
          </div>
          <div>
            <RelationshipDesc
              v-if="
                relationship.p2.wayOfCallingTheOther ||
                relationship.p2.relationshipWithTheOtherDesc
              "
              :from-id="id1"
              :to-id="id2"
              :way-of-calling-the-other="relationship.p2.wayOfCallingTheOther"
              :relationship-with-the-other-desc="
                relationship.p2.relationshipWithTheOtherDesc
              "
            ></RelationshipDesc>
            <RelationshipDesc
              v-if="
                relationship.p1.wayOfCallingTheOther ||
                relationship.p1.relationshipWithTheOtherDesc
              "
              class="mt-8"
              :from-id="id2"
              :to-id="id1"
              :way-of-calling-the-other="relationship.p1.wayOfCallingTheOther"
              :relationship-with-the-other-desc="
                relationship.p1.relationshipWithTheOtherDesc
              "
            ></RelationshipDesc>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PersonInputGroup from "@/components/input/PersonInputGroup.vue";
import { personApi } from "@/api/person";
import { RelationshipAnalysisResult } from "../../../../../backend/src/model/Person";
import { showDialogPersonDetailInfo } from "@/components/utilities";
import RelationshipDesc from "./RelationshipDesc.vue";

// throw Error("5 and 7");

export default defineComponent({
  components: {
    PersonInputGroup,
    RelationshipDesc,
  },
  data() {
    return {
      id1: null as string | null,
      id2: null as string | null,
      isLoading: false,
      relationship: undefined as RelationshipAnalysisResult | null | undefined,
    };
  },
  watch: {
    id1(v) {
      if (v && this.id2) {
        this.analyze();
      }
    },
    id2(v) {
      if (v && this.id1) {
        this.analyze();
      }
    },
  },
  methods: {
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
    showPersonDetailInfo(id: string) {
      showDialogPersonDetailInfo({
        personId: id,
      });
    },
    async analyze() {
      if (!this.id1 || !this.id2) {
        return;
      }

      this.isLoading = true;

      const { data } = await personApi.analyzeRelationship({
        id1: this.id1,
        id2: this.id2,
      });

      if ("data" in data) {
        this.relationship = data.data;
      } else {
        this.relationship = null;
      }

      this.isLoading = false;
    },
  },
});
</script>
