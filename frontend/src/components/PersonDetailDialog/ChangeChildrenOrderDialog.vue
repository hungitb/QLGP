<template>
  <CustomDialog
    v-model="dialogEditChildOrders"
    header="Chỉnh sửa thứ tự"
    maxWidth="400px"
    buttonText
    noPadding
    persistent
    :isLoading="isSavingNewChildOrders"
    :buttons="[
      {
        text: 'Lưu',
        click: saveNewChildOrders,
      },
    ]"
  >
    <v-list two-line>
      <v-list-item v-for="(id, i) in newChildOrders" :key="id + '-' + i">
        <v-list-item-avatar>
          <CustomPersonAvatar
            :person="$store.state.personMapping[id]"
            textSize="5"
          />
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>{{
            $store.state.personMapping[id].callname
          }}</v-list-item-title>
          <v-list-item-subtitle>{{
            genderDisplayText[$store.state.personMapping[id].gender]
          }}</v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <div class="d-flex justify-space-between" style="width: 90px">
            <v-btn
              v-if="i != 0"
              fab
              dark
              small
              color="primary"
              outlined
              @click="moveUpChild(i)"
            >
              <v-icon dark> mdi-arrow-up </v-icon>
            </v-btn>
            <v-spacer
              v-if="i == 0 || i == newChildOrders.length - 1"
            ></v-spacer>
            <v-btn
              v-if="i != newChildOrders.length - 1"
              fab
              dark
              small
              color="primary"
              outlined
              @click="moveDownChild(i)"
            >
              <v-icon dark> mdi-arrow-down </v-icon>
            </v-btn>
          </div>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </CustomDialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CustomDialog from "../CustomDialog.vue";
import CustomPersonAvatar from "../CustomPersonAvatar.vue";
import { personApi } from "@/api/person";
import { genderDisplayText } from "../../../../backend/src/model/Person";

export default defineComponent({
  components: {
    CustomDialog,
    CustomPersonAvatar,
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    childIds: {
      type: Array as () => string[],
      required: true,
    },
  },
  data() {
    return {
      genderDisplayText,
      isSavingNewChildOrders: false,
      newChildOrders: [...this.childIds],
    };
  },
  computed: {
    dialogEditChildOrders: {
      get() {
        return (this as any).value;
      },
      set(v: boolean) {
        this.$emit("input", v);
      },
    },
  },
  watch: {
    childIds(v: string[]) {
      this.isSavingNewChildOrders = false;
      this.newChildOrders = [...v];
    },
  },
  methods: {
    moveUpChild(childIdex: number) {
      if (childIdex > 0) {
        const swapElements = [
          this.newChildOrders[childIdex - 1],
          this.newChildOrders[childIdex],
        ];
        this.newChildOrders.splice(
          childIdex - 1,
          2,
          swapElements[1],
          swapElements[0]
        );
      }
    },
    moveDownChild(childIdex: number) {
      if (childIdex < this.newChildOrders.length - 1) {
        const swapElements = [
          this.newChildOrders[childIdex],
          this.newChildOrders[childIdex + 1],
        ];
        this.newChildOrders.splice(
          childIdex,
          2,
          swapElements[1],
          swapElements[0]
        );
      }
    },
    async saveNewChildOrders() {
      this.isSavingNewChildOrders = true;
      await personApi.swapYoungnessLevel({ ids: this.newChildOrders });
      this.isSavingNewChildOrders = false;
      this.$emit("newChildOrdersSaved");
    },
  },
});
</script>
