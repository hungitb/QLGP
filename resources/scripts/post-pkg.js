const path = require("path");
const { runProdCommand } = require("./utils");

// Đổi icon xong không chạy được file nữa, nên phải tạm thời không dùng nữa
process.exit(0);

const executable = path.resolve(__dirname, "..", "resource_hacker", "ResourceHacker.exe");
const icon = path.resolve(__dirname, "..", "app-icon", "icon.ico");
const input = path.resolve(__dirname, "..", "..", "qlgp.exe");
const output = path.resolve(__dirname, "..", "..", "qlgp2.exe");

runProdCommand({
    cmd: [executable, "-open", input, "-save", output, "-action", "addoverwrite", "-res", icon, "-mask", "ICONGROUP,IDR_MAINFRAME,"]
});
