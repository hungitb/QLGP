const fs = require("fs");
const path = require("path");
const { backendDir, frontendDir, runCommand } = require("./utils");

const flag = process.argv[2];
const command = process.argv[3];

if (flag == "fe" && command == "serve") {
    // Dev FE, remove default typescript vuex $store declare
    // If not remove $store will have type State<any> & State<{}> so that vscode can't inference
    const typeFilePath = path.resolve(frontendDir, "node_modules", "vuex", "types", "vue.d.ts");
    if (fs.existsSync(typeFilePath)) {
        const originalContent = fs.readFileSync(typeFilePath).toString();
        const text = "// $store: Store<any>; // Commented so that vscode can suggest properly"
        const modifiedContent = originalContent.replaceAll(text, "$$$$").replaceAll("$store: Store<any>;", text).replaceAll("$$$$", text);

        if (originalContent != modifiedContent) {
            fs.writeFileSync(typeFilePath, modifiedContent);
        }
    }
}

runCommand({
    cmd: ["npm", "--prefix=" + (flag == "fe" ? frontendDir : backendDir), "run", command]
});
