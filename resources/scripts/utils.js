const { spawn } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: ["./.env", "./default.env"] });

const backendDir = path.resolve(__dirname, "..", "..", "backend");
const frontendDir = path.resolve(__dirname, "..", "..", "frontend");
const isWindows = os.platform() === "win32";

function arrayToString(arr) {
    if (arr.length == 0) return "";
    return `[${arr.map(a => `"${a}"`).join(", ")}]`
}

function runCommand({ cmd, env = {} }) {
    const [command, ...args] = cmd;
    console.log(`RUN: ${command} ${arrayToString(args)}`);

    const executable = isWindows ? "cmd" : command;
    const commandArgs = isWindows ? ["/c", command, ...args] : args;

    return new Promise((resolve, reject) => {
        const command = spawn(executable, commandArgs, {
            stdio: "inherit",
            env: {
                ...process.env,
                ...env
            }
        });

        command.on("close", (code) => {
            if (code) {
                reject(`Command ${executable} ${arrayToString(commandArgs)} return none-zero status ${code}`);
                return;
            }
            resolve();
        });
    })
}

function copyDirSync(src, dest) {
    if (!fs.existsSync(src)) {
        throw new Error(`Source directory "${src}" does not exist.`);
    }

    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src);
    
    entries.forEach(entry => {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);

        if (fs.lstatSync(srcPath).isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

function deleteDirSync(dirPath) {
    if (fs.existsSync(dirPath)) {
        const entries = fs.readdirSync(dirPath);

        for (const entry of entries) {
            const entryPath = path.join(dirPath, entry);
            if (fs.lstatSync(entryPath).isDirectory()) {
                deleteDirSync(entryPath);
            } else {
                fs.unlinkSync(entryPath);
            }
        }
        // Remove the now-empty directory
        fs.rmdirSync(dirPath);
    } else {
        throw new Error(`Directory "${dirPath}" does not exist.`);
    }
}

module.exports = {
    backendDir,
    frontendDir,
    isWindows,
    runCommand,
    copyDirSync,
    deleteDirSync
}
