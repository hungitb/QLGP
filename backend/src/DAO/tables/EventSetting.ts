
import { DataTypes } from "sequelize"
import type { Sequelize } from "sequelize"

export default function getEventSettingTable (sequelize: Sequelize) {
    return sequelize.define('EventSetting', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        targetType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        specificPersonIds: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        numGenerationsAbove: {
            type: DataTypes.NUMBER,
            allowNull: false
        },
        numGenerationsBelow: {
            type: DataTypes.NUMBER,
            allowNull: false
        },
        includePeopleEqualGeneration: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    },
    {
        tableName: 'event_settings'
    })
}
