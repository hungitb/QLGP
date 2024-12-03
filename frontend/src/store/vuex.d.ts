import { Store } from "vuex";
import Vue, { ComponentOptions } from "vue";
import { type Person } from "../../../backend/src/model/Person";

declare module "vue/types/vue" {
  interface State {
    isLoadingPeople: boolean;
    people: Person[];
    personMapping: Record<string, Person>;
    personStandForUser: Person;
  }

  // provide typings for `this.$store`
  interface Vue {
    $store: Store<State>;
  }
}
