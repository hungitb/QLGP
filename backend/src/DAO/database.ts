
import { Sequelize } from "sequelize"
import path from "path"

import { getDAO } from "./utils"
import getPersonTable from "./tables/Person"
import getAccountTable from "./tables/Account"
import getFieldDefTable from "./tables/FieldDef"
import getFieldValTable from "./tables/FieldVal"

import type { Person } from "../../../model/Person"
import type { Account } from "../../../model/Account"
import type { FieldDef } from "../../../model/FieldDef"
import type { FieldVal } from "../../../model/FieldVal"

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, "..", "data", "database.sqlite")
})

export const personDAO = getDAO<Person>(getPersonTable(sequelize))
export const accountDAO = getDAO<Account>(getAccountTable(sequelize))
export const fieldDefDAO = getDAO<FieldDef>(getFieldDefTable(sequelize))
export const fieldValDAO = getDAO<FieldVal>(getFieldValTable(sequelize))

let connectionChecked = false
export async function getDatabaseInstance() {
    if (!connectionChecked) {
        await sequelize.authenticate()
        await sequelize.sync()

        console.log('Connection has been established successfully.')
        connectionChecked = true
    }

    return sequelize
}
