const { backendDir, frontendDir, runCommand } = require("./utils");

const flag = process.argv[2];
const command = process.argv[3];

runCommand({
    cmd: ["npm", "--prefix=" + (flag == "fe" ? frontendDir : backendDir), "run", command]
});
