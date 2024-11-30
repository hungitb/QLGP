
import { DataTypes } from "sequelize"
import type { Sequelize } from "sequelize"
import { SequlizeTableDefineColumns } from "./utils"
import { Person } from "../../../../general/model/Person"

export default function getPersonTable (sequelize: Sequelize) {
    return sequelize.define('Person', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        ownerUserId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isStandForUser: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        callname: {
            type: DataTypes.STRING(4096),
            allowNull: false
        },
        gender: {
            type: DataTypes.STRING,
            allowNull: false
        },
        avatarUrl: DataTypes.TEXT("medium"),
        birthdate: DataTypes.STRING,
        status: DataTypes.STRING,
        deathdate: DataTypes.STRING,
        spouseId: DataTypes.STRING,
        fatherId: DataTypes.STRING,
        motherId: DataTypes.STRING
    } as SequlizeTableDefineColumns<Person>,
    {
        tableName: 'people'
    })
}
