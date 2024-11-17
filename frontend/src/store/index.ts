import Vue from "vue";
import Vuex from "vuex";

import { Person } from "../../../general/model/Person";
import { personApi } from "@/api/person";

Vue.use(Vuex);

const SET_PEOPLE = "SET_PEOPLE";
const SET_IS_LOADING_PEOPLE = "SET_IS_LOADING_PEOPLE";

export const FETCH_PEOPLE = "FETCH_PEOPLE";

export default new Vuex.Store({
  state: {
    isLoadingPeople: false,
    people: [] as Person[],
  },
  getters: {},
  mutations: {
    [SET_PEOPLE](state, { people }) {
      state.people = people;
    },
    [SET_IS_LOADING_PEOPLE](state, { isLoadingPeople }) {
      state.isLoadingPeople = isLoadingPeople;
    },
  },
  actions: {
    async [FETCH_PEOPLE](context) {
      context.commit(SET_IS_LOADING_PEOPLE, { isLoadingPeople: true });
      try {
        const { data } = await personApi.getAllPeopleBaseInfo();
        if (data.people) {
          context.commit(SET_PEOPLE, { people: data.people });
        }
      } finally {
        context.commit(SET_IS_LOADING_PEOPLE, { isLoadingPeople: false });
      }
    },
  },
});
