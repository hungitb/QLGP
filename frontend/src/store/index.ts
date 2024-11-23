import Vue from "vue";
import Vuex from "vuex";

import { Person } from "../../../general/model/Person";
import { personApi } from "@/api/person";

Vue.use(Vuex);

const SET_PEOPLE = "SET_PEOPLE";
const SET_PERSON_MAPPING = "SET_PERSON_MAPPING";
const SET_IS_LOADING_PEOPLE = "SET_IS_LOADING_PEOPLE";
const SET_PERSON_STAND_FOR_USER = "SET_PERSON_STAND_FOR_USER";
const CLEAR_ALL_STATE_DATA = "CLEAR_ALL_STATE_DATA";

export const FETCH_PEOPLE = "FETCH_PEOPLE";
export const CLEAR_STORE = "CLEAR_STORE";

function getDefaultState() {
  return {
    isLoadingPeople: false,
    people: [] as Person[],
    personMapping: {} as Record<string, Person>,
    personStandForUser: null as Person | null,
  };
}

export default new Vuex.Store({
  state: getDefaultState(),
  getters: {},
  mutations: {
    [SET_PEOPLE](state, { people }) {
      state.people = people;
    },
    [SET_IS_LOADING_PEOPLE](state, { isLoadingPeople }) {
      state.isLoadingPeople = isLoadingPeople;
    },
    [SET_PERSON_MAPPING](state, { personMapping }) {
      state.personMapping = personMapping;
    },
    [SET_PERSON_STAND_FOR_USER](state, { personStandForUser }) {
      state.personStandForUser = personStandForUser;
    },
    [CLEAR_ALL_STATE_DATA](state) {
      Object.assign(state, getDefaultState());
    },
  },
  actions: {
    async [FETCH_PEOPLE](context) {
      context.commit(SET_IS_LOADING_PEOPLE, { isLoadingPeople: true });
      try {
        const { data } = await personApi.getAllPeopleBaseInfo();
        if (data.people) {
          const personMapping: Record<string, Person> = {};
          let personStandForUser = null;

          data.people.forEach((person) => {
            personMapping[person.id] = person;
            if (person.isStandForUser) {
              personStandForUser = person;
            }
          });

          context.commit(SET_PEOPLE, { people: data.people });
          context.commit(SET_PERSON_MAPPING, { personMapping });
          context.commit(SET_PERSON_STAND_FOR_USER, { personStandForUser });
        }
      } finally {
        context.commit(SET_IS_LOADING_PEOPLE, { isLoadingPeople: false });
      }
    },
    [CLEAR_STORE](context) {
      context.commit(CLEAR_ALL_STATE_DATA);
    },
  },
});
