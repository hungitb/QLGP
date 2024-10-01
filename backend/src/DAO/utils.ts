
import type { IDAO } from "../../../model/IDAO"

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

export {
    getDAO
}
