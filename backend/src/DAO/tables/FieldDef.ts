
import { DataTypes } from "sequelize"
import type { Sequelize } from "sequelize"
import { FieldDef } from "../../../../general/model/FieldDef"
import { SequlizeTableDefineColumns } from "./utils"

export default function getFieldDefTable (sequelize: Sequelize) {
    return sequelize.define('FieldDef', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        ownerUserId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(4096),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isMultiValue: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        isForAll: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    } as SequlizeTableDefineColumns<FieldDef>,
    {
        tableName: 'field_defs'
    })
}
