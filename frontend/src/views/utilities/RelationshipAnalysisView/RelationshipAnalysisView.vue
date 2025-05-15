<template>
  <div>
    <v-row>
      <v-col cols="12" md="6">
        <PersonInputGroup
          v-model="id1"
          label="Thành viên 1"
          one
          :exception-ids="id2 ? [id2] : []"
        />
      </v-col>
      <v-col cols="12" md="6">
        <PersonInputGroup
          v-model="id2"
          label="Thành viên 2"
          one
          :exception-ids="id1 ? [id1] : []"
        />
      </v-col>
    </v-row>

    <div v-if="!isLoading && id1 && id2 && relationship">
      <div>
        <div class="mx-auto" style="max-width: max(30%, 600px)">
          <div class="d-flex">
            <div>
              <PersonCard :id="id1" />
            </div>
            <div class="d-flex flex-column justify-space-around" style="flex: 1">
              <div v-if="relationship.p1.relationshipWithTheOtherDesc || relationship.p1.wayOfCallingTheOther">
                <ConnectingLine
                  :wayOfCallingTheOther="relationship.p1.wayOfCallingTheOther"
                  :relationshipWithTheOtherDesc="relationship.p1.relationshipWithTheOtherDesc"
                  is-upper-line>
                </ConnectingLine>
              </div>
              <div v-if="relationship.p2.relationshipWithTheOtherDesc || relationship.p2.wayOfCallingTheOther">
                <ConnectingLine
                  :wayOfCallingTheOther="relationship.p2.wayOfCallingTheOther"
                  :relationshipWithTheOtherDesc="relationship.p2.relationshipWithTheOtherDesc">
                </ConnectingLine>
              </div>
            </div>
            <div>
              <PersonCard :id="id2" />
            </div>
          </div>
          <div v-if="relationship.relationshipDetailDesc">
            <div class="text-center pa-4">
              <template v-for="g, i in splitRelationshipDetailDesc(relationship.relationshipDetailDesc)">
                <template v-if="g.type == 'text'">{{ g.value }}</template>
                <span v-else @click="showPersonDetailInfo(g.id)" class="green--text" style="cursor: pointer">{{ g.value }}</span>
              </template>.
            </div>
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
import PersonCard from "./PersonCard.vue";
import { RelationshipAnalysisResult } from "../../../../../backend/src/model/Person";
import ConnectingLine from "./ConnectingLine.vue";
import { showDialogPersonDetailInfo } from "@/components/utilities";

throw Error("2 and 3");

export default defineComponent({
  components: {
    PersonInputGroup, PersonCard, ConnectingLine
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
      const result: ({ type: "text", value: string } | { type: "person", id: string, value: string })[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null = null;

      while ((match = regex.exec(desc)) !== null) {
        const matchStart = match.index;

        if (matchStart > lastIndex) {
          result.push({
            type: "text",
            value: desc.slice(lastIndex, matchStart)
          });
        }

        result.push({
          type: "person",
          id: match[1].trim(),
          value: match[2].trim()
        });

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < desc.length) {
        result.push({
          type: "text",
          value: desc.slice(lastIndex)
        });
      }

      return result;
    },
    showPersonDetailInfo(id: string) {
      showDialogPersonDetailInfo({
        personId: id
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
