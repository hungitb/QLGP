import path from "path";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import cookiePaser from "cookie-parser";
import type { Request, Response, NextFunction } from "express";

dotenv.config({ path: "../.env" });

import authRouter from "./routes/auth";
import personRouter from "./routes/person";
import shareRouter from "./routes/share";
const isDev = process.env.NODE_ENV == "development";
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(morgan(isDev ? "dev" : "combined"));
app.use(cookiePaser());

app.use("/api/auth", authRouter);
app.use("/api/person", personRouter);
app.use("/api/share", shareRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);

    res.status(500).json({
        msg: "Internal Server Error"
    });
});

if (!isDev) {
    // Nếu sau này build thì sẽ copy vào folder public, dev thì không cần
    const staticDir = path.resolve(__dirname, "public");
    app.use(express.static(staticDir));
    app.get("*", (req, res) => {
        res.sendFile(path.join(staticDir, "index.html"));
    });
}

const port = parseInt(process.env.QLGP_BACKEND_PORT || "4800");
app.listen(port, () => {
    console.log(`Express running → PORT ${port} → http://localhost:${port}`);
});
