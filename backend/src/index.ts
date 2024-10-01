
import { getDatabaseInstance, personDAO } from "./DAO/database"

getDatabaseInstance().then(async db => {
    let a = await personDAO.count()
    console.log(a)
})
