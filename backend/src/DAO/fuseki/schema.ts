import { User } from "../../model/User";
import { Person } from "../../model/Person";
import { FieldDef } from "../../model/FieldDef";
import { FieldVal } from "../../model/FieldVal";
import { TableSchema } from "./TableSchema";
import { Share } from "../../model/Share";

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
        ownGraph: "boolean"
    }
});

const personSchema = new TableSchema<Person>({
    name: "person",
    fields: {
        id: {
            type: "string",
            primaryKey: true
        },
        ownerUserId: {
            type: userSchema,
            allowNull: false,
            alias: "belongToUser"
        },
        isStandForUser: {
            type: "boolean",
            allowNull: false
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
        }
    }
});

const shareSchema = new TableSchema<Share>({
    name: "share",
    fields: {
        id: {
            type: "string",
            primaryKey: true
        },
        from: userSchema,
        to: userSchema,
        perm: "string"
    }
});

export const personDAO = personSchema.getDAO();
export const userDAO = userSchema.getDAO();
export const shareDAO = shareSchema.getDAO();

