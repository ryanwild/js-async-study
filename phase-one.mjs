// Uses Node.js ES Modules see here: 
// https://nodejs.org/docs/latest-v14.x/api/esm.html#esm_enabling

import { assert, log } from "console";
import fs from "fs/promises";
import { resolve as resolvePath } from "path";

const utilEquals = (a, b) => (
    a.length === b.length &&
    a.every((v, i) => v === b[i])
);

const resolveFiles = (dir) => list => (
    list.map(filename => resolvePath(dir, filename))
);

const recurseSubDirectory = (collected) => (list) => (
    Promise.all(
        list.map(async (item) => {
            if (item.stat.isDirectory()) {
                list.push(
                    (await collectFiles(item.file, collected))
                );
            }
            return item;
        })
    )
);

const mapFileStats = (list) => (
    Promise.all(
        list.map(async (file) => {
            const stat = await fs.stat(file);
            return {
                file,
                stat,
            };
        })
    )
);

const onlyFiles = list => (
    list.filter(({ stat }) => stat.isFile())
);

const onlyFileType = list => (
    list.filter(({ file }) => file.endsWith(".md"))
);

const mapFile = list => list.map(({ file }) => file);


const collectFiles = async (dir, collected = []) => {
    const files = await fs.readdir(dir)
        .then(resolveFiles(dir))
        .then(mapFileStats)
        .then(recurseSubDirectory(collected))
        .then(onlyFiles)
        .then(onlyFileType)
        .then(mapFile);

    collected.push(...files);
    return collected;
}

const test = async () => {
    let files = [];
    const directory = "./example";
    const expected = [
        "example/subfolder/super-secret.md",
        "example/one.md",
        "example/two.md"
    ].map(file => resolvePath(file));

    log(`Collecting files from: ${directory}`);

    try {
        files = await collectFiles(directory);
        log(`Result:`, files);
        assert(utilEquals(expected, files));
    } catch (err) {
        log(err);
    }
};

test();
