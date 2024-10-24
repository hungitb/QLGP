
import { Sequelize } from "sequelize"
import path from "path"

import getPersonTable from "./tables/Person"
import getAccountTable from "./tables/Account"
import getFieldDefTable from "./tables/FieldDef"
import getFieldValTable from "./tables/FieldVal"

import type { IDAO } from "../../../general/model/IDAO"
import type { Person } from "../../../general/model/Person"
import type { Account } from "../../../general/model/Account"
import type { FieldDef } from "../../../general/model/FieldDef"
import type { FieldVal } from "../../../general/model/FieldVal"

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, "..", "..", "data", "database.sqlite")
})

function getDAO<K>(table: any): IDAO<K> {
    return {
        findByPk: table.findByPk.bind(table),
        findOne: table.findOne.bind(table),
        findAll: table.findAll.bind(table),
        count: table.count.bind(table),
        create: table.create.bind(table),
        destroy: table.destroy.bind(table),
        update: table.update.bind(table),
    }
}

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
