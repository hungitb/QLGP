import { User } from "../../model/User";
import { Person } from "../../model/Person";
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
            type: "int"
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
            allowNull: false
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
        createdAt: "date"
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
            type: "int",
            alias: "ancestorStartingNumber"
        }
    },
    initValue: getDefaultThongTinGiaPhaValue()
});

export const personDAO = personSchema.getDAO();
export const userDAO = userSchema.getDAO();
export const ttgpDASO = ttgpSchema.getDASO();

