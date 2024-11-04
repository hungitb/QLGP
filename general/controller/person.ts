import { compareTwoDateString } from "../utils/DateUtils";
import { CommonResponse, paginateAndSortItems } from "./utils";
import type { PaginateParams } from "./utils";
import { LifeStatus, type Person } from "../model/Person";
import type { User } from "../model/User";
import type { IDAO } from "../model/IDAO";

export default function getPersonController(personDAO: IDAO<Person>) {
    async function getAllPeopleBaseInfo(data: PaginateParams, loggedInUser: User | null) {
        if (!loggedInUser) return CommonResponse[401];

        const people = await personDAO.findAll({ where: { ownerUserId: loggedInUser.userId } });
        let compare: undefined | ((v1: any, v2: any, k1: Person, k2: Person) => number) = undefined;

        if (data.sortBy == "status_deathday") {
            data.sortBy = "status";
            const sortDesc = data.sortDesc == "true";

            compare = (v1, v2, k1, k2) => {
                if (v1 != v2) {
                    return v1 == LifeStatus.ALIVE ? -1 : 1;
                }
                return compareTwoDateString(k1.deathday, k2.deathday, sortDesc);
            }
        }

        if (data.sortBy == "birthday") {
            const sortDesc = data.sortDesc == "true";

            compare = (v1, v2) => {
                return compareTwoDateString(v1, v2, sortDesc);
            }
        }

        return {
            data: {
                people: paginateAndSortItems(people, data, compare),
                total: people.length
            },
            status: 200
        };
    }

    return {
        getAllPeopleBaseInfo
    }
}
