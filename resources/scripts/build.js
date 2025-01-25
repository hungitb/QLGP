const { runProdCommand, copyDirSync, deleteDirSync, clearDirSync, backendDir, frontendDir } = require("./utils");
const path = require("path");

const distDir = path.resolve(__dirname, "..", "..", "dist");

async function buildStatic() {
    await runProdCommand({
        cmd: ["npm", "--prefix=" + frontendDir, "run", "build"],
        useBackend: false
    });

    clearDirSync(path.resolve(distDir, "static"));
    copyDirSync(
        path.resolve(frontendDir, "dist"),
        path.resolve(distDir, "static")
    );

    deleteDirSync(path.resolve(frontendDir, "dist"));
}

async function buildFull({ fe = true, be = true } = {}) {
    if (fe) {
        await runProdCommand({ cmd: ["npm", "--prefix=" + frontendDir, "run", "build"] });

        clearDirSync(path.resolve(distDir, "full", "public"));
        copyDirSync(
            path.resolve(frontendDir, "dist"),
            path.resolve(distDir, "full", "public")
        );
        deleteDirSync(path.resolve(frontendDir, "dist"));
    }

    if (be) {
        await runProdCommand({ cmd: ["npm", "--prefix=" + backendDir, "run", "build"] });

        clearDirSync(path.resolve(distDir, "full"), { exceptions: ["public"] })
        copyDirSync(
            path.resolve(backendDir, "dist"),
            path.resolve(distDir, "full")
        );
        deleteDirSync(path.resolve(backendDir, "dist"));
    }
}

async function build() {
    const buildMode = ["fe", "be", "static"].includes(process.argv[2]) ? process.argv[2] : "all";

    if (buildMode == "static") {
        await buildStatic();
        return;
    }

    await buildFull({
        fe: ["fe", "all"].includes(buildMode),
        be: ["be", "all"].includes(buildMode)
    });
}

build().catch(err => {
    console.log(err);
    process.exit(1);
});
