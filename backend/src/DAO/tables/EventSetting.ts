
import { DataTypes } from "sequelize"
import type { Sequelize } from "sequelize"
import { SequlizeTableDefineColumns } from "./utils"
import { EventSetting } from "../../model/EventSetting"

export default function getEventSettingTable (sequelize: Sequelize) {
    return sequelize.define('EventSetting', {
        userId: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        targetType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        types: {
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
    } as SequlizeTableDefineColumns<EventSetting>,
    {
        tableName: 'event_settings'
    })
}
