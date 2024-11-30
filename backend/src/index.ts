import path from "path";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import cookiePaser from "cookie-parser";
import type { Request, Response, NextFunction } from "express";

dotenv.config({ path: ["../.env", "../default.env"] });

import { getDatabaseInstance } from "./DAO/database";
import authRouter from "./routes/auth";
import personRouter from "./routes/person";
import eventRouter from "./routes/event";

getDatabaseInstance().then(async () => {
    const isDev = process.env.NODE_ENV == "development";
    const app = express();
    app.use(express.json({ limit: "50mb" }));
    app.use(morgan(isDev ? "dev" : "combined"));
    app.use(cookiePaser());
    if (!isDev) {
        // Nếu sau này build thì sẽ copy vào folder public, dev thì không cần
        app.use(express.static(path.resolve(__dirname, "public")));
    }
    app.use((req, res, next) => {
        // Assign query parameters to body
        req.body = {
            ...req.body,
            ...req.query,
            ...req.params
        };
        next();
    });

    app.use("/api/auth", authRouter);
    app.use("/api/person", personRouter);
    app.use("/api/event", eventRouter);

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
