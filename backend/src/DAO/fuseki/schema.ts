import { User } from "../../model/User";
import { Person } from "../../model/Person";
import { EventSetting } from "../../model/EventSetting";
import { FieldDef } from "../../model/FieldDef";
import { FieldVal } from "../../model/FieldVal";
import { TableSchema } from "./TableSchema";

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
        }
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
            allowNull: false
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
        spouseId: "__self__",
        fatherId: "__self__",
        motherId: "__self__"
    }
});

const eventSettingSchema = new TableSchema<EventSetting>({
    name: "event_setting",
    fields: {
        userId: {
            type: userSchema,
            primaryKey: true
        },
        targetType: {
            type: "string",
            allowNull: false
        },
        types: {
            type: "string",
            allowNull: false
        },
        specificPersonIds: {
            type: "string",
            allowNull: false
        },
        numGenerationsAbove: {
            type: "int",
            allowNull: false
        },
        numGenerationsBelow: {
            type: "int",
            allowNull: false
        },
        includePeopleEqualGeneration: {
            type: "boolean",
            allowNull: false
        }
    }
});

export const personDAO = personSchema.getDAO();
export const userDAO = userSchema.getDAO();
export const eventSettingDAO = eventSettingSchema.getDAO();

