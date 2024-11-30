const { runCommand, copyDirSync, deleteDirSync } = require("./utils");
const path = require("path");

const backendDir = path.resolve(__dirname, "..", "..", "backend");
const frontendDir = path.resolve(__dirname, "..", "..", "frontend");

async function build() {
    await runCommand("npm", "--prefix=" + backendDir, "install");
    await runCommand("npm", "--prefix=" + backendDir, "run", "build");
    await runCommand("npm", "--prefix=" + frontendDir, "install");
    await runCommand("npm", "--prefix=" + frontendDir, "run", "build");

    copyDirSync(
        path.resolve(frontendDir, "dist"),
        path.resolve(backendDir, "dist", "public")
    );

    // Clear
    deleteDirSync(path.resolve(frontendDir, "dist"));
}

build().catch(err => {
    console.log(err);
    process.exit(1);
})
