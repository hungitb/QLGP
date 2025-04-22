import { User } from "../../model/User";
import { Person, PersonAdvanceDAO } from "../../model/Person";
import { FieldDef } from "../../model/FieldDef";
import { FieldVal } from "../../model/FieldVal";
import { TableSchema, TableSchemaSingleRow } from "./TableSchema";
import { getDefaultThongTinGiaPhaValue, ThongTinGiaPha } from "../../model/ThongTinGiaPha";

const userSchema = new TableSchema<User>({
    name: "user",
    fields: {
        id: {
            type: "string",
            primaryKey: true
        },
        username: {
            type: "string",
            allowNull: false
        },
        password: {
            type: "string",
            allowNull: false
        },
        sessionToken: {
            type: "string"
        },
        sessionExpiry: {
            type: "integer"
        },
        permission: {
            type: "string",
            allowNull: false
        },
        note: {
            type: "string",
            allowNull: false
        },
        createdAt: "date"
    }
});

const personSchema = new TableSchema<Person>({
    name: "person",
    fields: {
        id: {
            type: "string",
            primaryKey: true
        },
        callname: {
            type: "string",
            allowNull: false,
            alias: "name"
        },
        gender: {
            type: "string",
            allowNull: false
        },
        avatarUrl: "string",
        birthdate: "string",
        status: "string",
        deathdate: "string",
        spouseId: {
            type: "__self__",
            alias: "hasSpouse"
        },
        fatherId: {
            type: "__self__",
            alias: "hasFather"
        },
        motherId: {
            type: "__self__",
            alias: "hasMother"
        },
        createdAt: "date",
        youngnessLevel: "integer"
    }
});

const ttgpSchema = new TableSchemaSingleRow<ThongTinGiaPha>({
    name: "thongTinGiaPha",
    fields: {
        idToTien: {
            type: personSchema,
            alias: "ancestor"
        },
        thongTinKhac: {
            type: "string",
            alias: "otherInfo"
        },
        tenDongHo: {
            type: "string",
            alias: "familyName"
        },
        type: "string",
        soDoiCuaToTien: {
            type: "integer",
            alias: "ancestorStartingNumber"
        }
    },
    initValue: getDefaultThongTinGiaPhaValue()
});

export const personDAO = personSchema.getDAO();
export const userDAO = userSchema.getDAO();
export const ttgpDASO = ttgpSchema.getDASO();

export const personAdvanceDAO: PersonAdvanceDAO = (() => {
    const isPersonBelongToFamily = async (id: string) => {
        const result = await personSchema.execSelectQuery(`
            SELECT ?x WHERE {
                person:${id} person:thuocGiaPha ?x
                FILTER (?x = "true")
            }
        `);

        return result.results.bindings.length > 0;
    };

    const isPeopleBelongToFamily = async (ids: string[]) => {
        const result = await personSchema.execSelectQuery<"x">(`
            SELECT ?x WHERE {
                ?x person:thuocGiaPha "true"
            }
        `);

        const validIds = new Set(result.results.bindings.map(
            t => personSchema.removeSelfPrefix(t.x.value)
        ));

        return ids.reduce((result, id) => {
            result[id] = validIds.has(id);
            return result;
        }, {} as Record<string, boolean>);
    };

    return {
        isPersonBelongToFamily,
        isPeopleBelongToFamily
    };
})();

