
import { DataTypes } from "sequelize"
import type { Sequelize } from "sequelize"

export default function getUserTable (sequelize: Sequelize) {
    return sequelize.define('User', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        sessionToken: {
            type: DataTypes.STRING,
            defaultValue: null
        },
        sessionExpiry: {
            type: DataTypes.BIGINT,
            defaultValue: null
        },
    },
    {
        tableName: 'users'
    })
}
