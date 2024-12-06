const { runProdCommand, copyDirSync, deleteDirSync, backendDir, frontendDir } = require("./utils");
const path = require("path");

async function build() {
    const buildMode = ["fe", "be"].includes(process.argv[2]) ? process.argv[2] : "all";

    if (buildMode == "be" || buildMode == "all") {
        await runProdCommand({ cmd: ["npm", "--prefix=" + backendDir, "run", "build"] });
    }

    if (buildMode == "fe" || buildMode == "all") {
        await runProdCommand({ cmd: ["npm", "--prefix=" + frontendDir, "run", "build"] });
    
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
