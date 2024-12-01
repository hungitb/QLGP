const { runCommand: _runCommand, copyDirSync, deleteDirSync, backendDir, frontendDir } = require("./utils");
const path = require("path");

async function build() {
    const runCommand = (...args) => _runCommand({ cmd: args, env: { NODE_ENV: "production" } });
    
    const buildMode = ["fe", "be"].includes(process.argv[2]) ? process.argv[2] : "all";

    if (buildMode == "be" || buildMode == "all") {
        await runCommand("npm", "--prefix=" + backendDir, "install", "--include=dev");
        await runCommand("npm", "--prefix=" + backendDir, "run", "build");
    }

    if (buildMode == "fe" || buildMode == "all") {
        await runCommand("npm", "--prefix=" + frontendDir, "install", "--include=dev");
        await runCommand("npm", "--prefix=" + frontendDir, "run", "build");
    
        copyDirSync(
            path.resolve(frontendDir, "dist"),
            path.resolve(backendDir, "dist", "public")
        );
        deleteDirSync(path.resolve(frontendDir, "dist"));
    }
}

build().catch(err => {
    console.log(err);
    process.exit(1);
})
