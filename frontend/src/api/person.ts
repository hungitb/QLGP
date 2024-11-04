import api from "./api";
import {
  useBackend,
  wrapAxiosCall,
  getLoggedInUserLocalStorage,
  stringifyValuesOfObject,
} from "./utils";
import type { ApiResponseWrapper as ARW } from "./utils";
import getPersonController from "../../../general/controller/person";
import type { Person } from "../../../general/model/Person";
import { personDAO } from "./DAO";
import { PaginateParams } from "../../../general/controller/utils";

const personController = getPersonController(personDAO);

export const personApi = {
  async getAllPeopleBaseInfo(
    data: PaginateParams
  ): Promise<ARW<{ people: Person[]; total: number }>> {
    if (useBackend) {
      // to do
    }

    return await personController.getAllPeopleBaseInfo(
      stringifyValuesOfObject(data),
      await getLoggedInUserLocalStorage()
    );
  },
};
