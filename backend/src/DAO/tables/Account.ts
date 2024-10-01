
import { DataTypes } from "sequelize"
import type { Sequelize } from "sequelize"

export default function getAccountTable (sequelize: Sequelize) {
    return sequelize.define('Account', {
        userId: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        hashedPassword: {
            type: DataTypes.STRING,
            allowNull: false
        },
    },
    {
        tableName: 'accounts'
    })
}
