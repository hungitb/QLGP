
import dotenv from "dotenv";
import express from "express";
import type { Request, Response, NextFunction } from "express";

dotenv.config({ path: ["../.env", "../default.env"] });

import { getDatabaseInstance } from "./DAO/database";
import authRouter from "./routes/auth";

getDatabaseInstance().then(async () => {
    const app = express();
    app.use(express.json());

    app.use("/api/auth", authRouter);

    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        console.error(err.stack);

        res.status(500).json({
            msg: "Internal Server Error"
        });
    });

    const port = parseInt(process.env.QLGP_BACKEND_PORT || "4800");
    app.listen(port, () => {
        console.log(`Express running → PORT ${port}`);
    })
})
