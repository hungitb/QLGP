const { runCommand, copyDirSync, deleteDirSync } = require("./utils");
const path = require("path");

const backendDir = path.resolve(__dirname, "..", "..", "backend");
const frontendDir = path.resolve(__dirname, "..", "..", "frontend");

async function build() {
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
