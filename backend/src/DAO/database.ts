
import { Sequelize } from "sequelize";
import path from "path";

import getPersonTable from "./tables/Person";
import getUserTable from "./tables/User";
import getFieldDefTable from "./tables/FieldDef";
import getFieldValTable from "./tables/FieldVal";
import getEventSettingTable from "./tables/EventSetting";

import type { IDAO } from "../model/IDAO";
import type { Person } from "../model/Person";
import type { User } from "../model/User";
import type { FieldDef } from "../model/FieldDef";
import type { FieldVal } from "../model/FieldVal";
import type { EventSetting } from "../model/EventSetting";

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, "..", "..", "..", "app-data", "database.sqlite"),
    logging: false,
});

function getDAO<K>(table: any): IDAO<K> {
    // Data lấy từ db chưa phải định dạng chuẩn nên cần biến đổi
    function boundQueryToTransformData(func: any) {
        function transform(model: any) {
            if (!model) return model;
            return model.get({ plain: true })
        }
        return async (...params: any[]) => {
            const data = await func(...params);
            if (Array.isArray(data)) return data.map(transform);
            return transform(data);
        }
    }
    return {
        findByPk: boundQueryToTransformData(table.findByPk.bind(table)),
        findOne: boundQueryToTransformData(table.findOne.bind(table)),
        findAll: boundQueryToTransformData(table.findAll.bind(table)),
        count: table.count.bind(table),
        create: table.create.bind(table),
        destroy: table.destroy.bind(table),
        update: table.update.bind(table),
    };
}

export const personDAO = getDAO<Person>(getPersonTable(sequelize));
export const userDAO = getDAO<User>(getUserTable(sequelize));
export const fieldDefDAO = getDAO<FieldDef>(getFieldDefTable(sequelize));
export const fieldValDAO = getDAO<FieldVal>(getFieldValTable(sequelize));
export const eventSettingDAO = getDAO<EventSetting>(getEventSettingTable(sequelize));

let connectionChecked = false;
export async function getDatabaseInstance() {
    if (!connectionChecked) {
        await sequelize.authenticate();
        await sequelize.sync();

        connectionChecked = true;
    }

    return sequelize;
}
