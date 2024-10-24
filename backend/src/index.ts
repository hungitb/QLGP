
import dotenv from "dotenv"
import express from "express"

dotenv.config({ path: ["../.env", "../default.env"] })

import { getDatabaseInstance } from "./DAO/database"
import authRouter from "./routes/auth"

getDatabaseInstance().then(async db => {
    const app = express()
    app.use(express.json())

    app.use("/api/auth", authRouter)

    const port = parseInt(process.env.QLGP_BACKEND_PORT || "4800")
    app.listen(port, () => {
        console.log(`Express running → PORT ${port}`)
    })
})
