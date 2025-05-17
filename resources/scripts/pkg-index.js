const fs = require("fs");
const path = require("path");
const { runProdCommand } = require("./utils");

const candidates = [
    ["index.js"],
    ["dist", "index.js"],
    ["dist", "full", "index.js"],
    ["backend", "dist", "index.js"]
];

const index = candidates.map(pathArr => path.resolve(...pathArr)).find(path => fs.existsSync(path));
if (!index) {
    console.log("Không tìm thấy mã nguồn để chạy chương trình!");
    process.exit(1);
}

runProdCommand({
    cmd: ["node", index],
    printExecutedCommand: false
});
