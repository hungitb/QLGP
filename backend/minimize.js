const { readFile, writeFile, readdir, stat } = require('node:fs/promises');
const path = require('node:path');
const fs = require('node:fs');
const { minify } = require('terser');

async function minimizeFile(inputPath, outputPath) {
    const code = await readFile(inputPath, 'utf8');
    const minifiedOutput = await minify(code);

    if (minifiedOutput.code) {
        await writeFile(outputPath, minifiedOutput.code, 'utf8');
        console.log(`Minimized: ${inputPath} -> ${outputPath}`);
    } else if (minifiedOutput.error) {
        throw Error(`Error minimizing ${inputPath}: `, minifiedOutput.error);
    }
}

async function processDirectory(inputDir, outputDir) {
    await fs.promises.mkdir(outputDir, { recursive: true });
    const items = await readdir(inputDir);

    for (const item of items) {
        const inputPath = path.join(inputDir, item);
        const outputPath = path.join(outputDir, item);
        const stats = await stat(inputPath);

        if (stats.isFile() && item.endsWith('.js')) {
            await minimizeFile(inputPath, outputPath);
        } else if (stats.isDirectory()) {
            await processDirectory(inputPath, outputPath);
        }
    }
}

async function main() {
    const inputFolder = path.resolve(__dirname, "dist");
    const outputFolder = path.resolve(__dirname, "dist_minimized");
    await processDirectory(inputFolder, outputFolder);
}

main();
