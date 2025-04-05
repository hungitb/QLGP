import Vue from "vue";
import Vuex from "vuex";

import { Person } from "../../../backend/src/model/Person";
import { personApi } from "@/api/person";
import { User } from "../../../backend/src/model/User";
import { UserInfo } from "../../../backend/src/controller/utils";

Vue.use(Vuex);

export const SET_USER = "SET_USER";
const SET_PEOPLE = "SET_PEOPLE";
const SET_PERSON_MAPPING = "SET_PERSON_MAPPING";
const SET_IS_LOADING_PEOPLE = "SET_IS_LOADING_PEOPLE";
const SET_ID_TO_TIEN = "SET_ID_TO_TIEN";
const CLEAR_ALL_STATE_DATA = "CLEAR_ALL_STATE_DATA";

export const UPDATE_USER = "UPDATE_USER";
export const FETCH_PEOPLE = "FETCH_PEOPLE";
export const CLEAR_STORE = "CLEAR_STORE";

type StoreState = {
  user: UserInfo;
  idToTien: UserInfo["thongTinGiaPha"]["idToTien"];
  isLoadingPeople: boolean;
  people: Person[];
  personMapping: Record<string, Person>;
};

export function getDefaultState(): StoreState {
  return {
    user: null as unknown as UserInfo,
    idToTien: null,
    isLoadingPeople: false,
    people: [],
    personMapping: {},
  };
}

export default new Vuex.Store({
  state: getDefaultState(),
  getters: {
    idToTien: (state) => state.user.thongTinGiaPha.idToTien,
  },
  mutations: {
    [SET_USER](state, { user }) {
      state.user = user;
    },
    [SET_ID_TO_TIEN](state, { idToTien }) {
      state.idToTien = idToTien;
    },
    [SET_PEOPLE](state, { people }) {
      state.people = people;
    },
    [SET_IS_LOADING_PEOPLE](state, { isLoadingPeople }) {
      state.isLoadingPeople = isLoadingPeople;
    },
    [SET_PERSON_MAPPING](state, { personMapping }) {
      state.personMapping = personMapping;
    },
    [CLEAR_ALL_STATE_DATA](state) {
      Object.assign(state, getDefaultState());
    },
  },
  actions: {
    [UPDATE_USER](context, { user }: { user: StoreState["user"] }) {
      context.commit(SET_USER, { user });
      if (user) {
        context.commit(SET_ID_TO_TIEN, {
          idToTien: user.thongTinGiaPha.idToTien,
        });
      } else {
        context.commit(SET_ID_TO_TIEN, { idToTien: null });
      }
    },
    async [FETCH_PEOPLE](context) {
      context.commit(SET_IS_LOADING_PEOPLE, { isLoadingPeople: true });
      try {
        const { data } = await personApi.getAllPeopleBaseInfo({});
        if ("people" in data) {
          const personMapping: Record<string, Person> = {};

          data.people.forEach((person) => {
            personMapping[person.id] = person;
          });

          context.commit(SET_PEOPLE, { people: data.people });
          context.commit(SET_PERSON_MAPPING, { personMapping });
        } else {
          context.commit(SET_PEOPLE, { people: [] });
          context.commit(SET_PERSON_MAPPING, { personMapping: {} });
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
