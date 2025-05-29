import { v4 as uuidv4 } from "uuid";
import { IDAO } from "../model/IDAO";
import { User } from "../model/User";
import { ControllerHandlerResult as CHR, CanWriteGuard, CommonResponse, IsAdminGuard, Prettify, SafeOmit, UserInfo, applyUserGuards, badRequetWithMsg, runPromisesInBatchs } from "./utils";
import { DEFAUT_ADMIN_USERNAME } from "./auth";
import { nowDate, sortByStdDate } from "../utils/DateUtils";
import { FieldDef } from "../model/FieldDef";
import { Person } from "../model/Person";
import { FieldVal } from "../model/FieldVal";

export type ExtendedFieldDef = FieldDef & ({ isForAll: true } | { isForAll: false, specificPersonId: string });
export type FieldDataToEdit = Prettify<SafeOmit<FieldDef, "createdAt" | "isForAll" | "type">>;

export default function getFieldDefController(fieldDefDAO: IDAO<FieldDef>, fieldValDAO: IDAO<FieldVal>, personDAO: IDAO<Person>) {
    const getAllFieldDefs = applyUserGuards<
        {},
        {},
        {
            fieldDefs: ExtendedFieldDef[]
        }
    >(async () => {
        const fieldDefs = await fieldDefDAO.findAll();
        const extendedFieldDefs: ExtendedFieldDef[] = await Promise.all(fieldDefs.map(async fd => {
            if (fd.isForAll) {
                return {
                    ...fd,
                    isForAll: true as const
                };
            }
            const fieldVal = await fieldValDAO.findOne({ where: { fieldDefId: fd.id } });

            return {
                ...fd,
                isForAll: false,
                specificPersonId: fieldVal!.personId
            }
        }));

        return {
            data: {
                fieldDefs: sortByStdDate("createdAt", extendedFieldDefs)
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

    const updateFieldDef = applyUserGuards<
        { data: FieldDataToEdit },
        {}
    >(async ({ body: { data } }) => {
        if (
            typeof data.id != "string" ||
            typeof data.name != "string" ||
            data.name.trim() == "" ||
            typeof data.description != "string"
        ) {
            return CommonResponse.BAD_REQUEST;
        }

        const fieldDef = await fieldDefDAO.findByPk(data.id);
        if (!fieldDef) return CommonResponse.BAD_REQUEST;

        await fieldDefDAO.update({
            name: data.name.trim(),
            description: data.description.trim()
        }, {
            where: { id: data.id }
        });

        return CommonResponse.OK;
    }, CanWriteGuard);

    const deleteFieldDef = applyUserGuards<
        {},
        { id: string }
    >(async ({ query: { id } }) => {
        if (typeof id != "string") return CommonResponse.BAD_REQUEST;

        const fieldDef = await fieldDefDAO.findByPk(id);
        if (!fieldDef) return CommonResponse.BAD_REQUEST;

        await fieldValDAO.destroy({ where: { fieldDefId: id } });
        await fieldDefDAO.destroy({ where: { id } });

        return CommonResponse.OK;
    }, CanWriteGuard);

    const updateFieldVal = applyUserGuards<
        { data: { id: string, value: string }[] },
        {}
    >(async ({ body: { data } }) => {
        if (!Array.isArray(data)) {
            return CommonResponse.BAD_REQUEST;
        }

        if (!data.every(i => {
            if (typeof i.id != "string") return false;
            if (typeof i.value != "string") return false;
            return true;
        })) {
            return CommonResponse.BAD_REQUEST;
        }

        const fieldVals = await fieldValDAO.findAllIdsIn(data.map(i => i.id));
        if (fieldVals.length != data.length) {
            return CommonResponse.BAD_REQUEST;
        }
        const fieldValMapping: Record<string, FieldVal> = {};
        fieldVals.forEach(fv => fieldValMapping[fv.id] = fv);

        await Promise.all(
            data.map(({ id, value }) => {
                console.log(id, `"${value}"`, fieldValMapping[id].value == value)
                if (fieldValMapping[id].value == value) return Promise.resolve();
                return fieldValDAO.update({ value }, { where: { id } });
            })
        );

        return CommonResponse.OK;
    }, CanWriteGuard);

    return {
        getAllFieldDefs, createFieldDef, updateFieldDef, deleteFieldDef,
        updateFieldVal
    };
}
