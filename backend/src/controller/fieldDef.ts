import { v4 as uuidv4 } from "uuid";
import { IDAO } from "../model/IDAO";
import { User } from "../model/User";
import { ControllerHandlerResult as CHR, CanWriteGuard, CommonResponse, IsAdminGuard, SafeOmit, UserInfo, applyUserGuards, badRequetWithMsg, runPromisesInBatchs } from "./utils";
import { DEFAUT_ADMIN_USERNAME } from "./auth";
import { nowDate, sortByStdDate } from "../utils/DateUtils";
import { FieldDef } from "../model/FieldDef";
import { Person } from "../model/Person";
import { FieldVal } from "../model/FieldVal";

export default function getFieldDefController(fieldDefDAO: IDAO<FieldDef>, fieldValDAO: IDAO<FieldVal>, personDAO: IDAO<Person>) {
    const getAllFieldDefs = applyUserGuards<
        {},
        {},
        {
            fieldDefs: FieldDef[]
        }
    >(async () => {
        const fieldDefs = await fieldDefDAO.findAll();

        return {
            data: {
                fieldDefs: sortByStdDate("createdAt", fieldDefs)
            },
            status: 200
        };
    }, CanWriteGuard);

    const createFieldDef = applyUserGuards<
        { data: SafeOmit<FieldDef, "id" | "createdAt"> & ({ isForAll: true } | { isForAll: false, specificPersonId: string }) },
        {}
    >(async ({ body: { data } }) => {
        // Validate data

        const fieldDef: FieldDef = {
            id: uuidv4(),
            name: data.name,
            description: data.description,
            type: data.type,
            isForAll: data.isForAll,
            createdAt: nowDate()
        };
        await fieldDefDAO.create(fieldDef);

        if (data.isForAll) {
            const people = await personDAO.findAll();
            await runPromisesInBatchs(people.map(person => {
                return () => {
                    return fieldValDAO.create({
                        id: uuidv4(),
                        personId: person.id,
                        fieldDefId: fieldDef.id,
                        value: null
                    });
                };
            }), 30);
        } else {
            await fieldValDAO.create({
                id: uuidv4(),
                personId: data.specificPersonId,
                fieldDefId: fieldDef.id,
                value: null
            });
        }

        return CommonResponse.OK;
    }, CanWriteGuard);

    return {
        getAllFieldDefs
    };
}
