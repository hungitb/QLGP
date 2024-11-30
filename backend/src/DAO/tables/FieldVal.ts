
import { DataTypes } from "sequelize"
import type { Sequelize } from "sequelize"
import { SequlizeTableDefineColumns } from "./utils"
import { FieldVal } from "../../model/FieldVal"

export default function getFieldValTable (sequelize: Sequelize) {
    return sequelize.define('FieldVal', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        personId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fieldDefId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        value: DataTypes.TEXT("medium")
    } as SequlizeTableDefineColumns<FieldVal>,
    {
        tableName: 'field_vals'
    })
}
