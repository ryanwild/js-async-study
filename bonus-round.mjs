// Uses Node.js ES Modules see here: 
// https://nodejs.org/docs/latest-v14.x/api/esm.html#esm_enabling

import { assert, log } from "console";
import fs from "fs/promises";
import { resolve as resolvePath } from "path";

const utilEquals = (a, b) => (
    a.length === b.length &&
    a.every((v, i) => v === b[i])
);

const filterFiles = (extension) => (list) => (
    list.filter(dirent =>
        (
            !extension &&
            dirent.isFile()
        ) ||
        (
            dirent.isFile() &&
            extension &&
            dirent.name.endsWith(extension)
        )
    )
);

const recurseSubDirectory = (directory, collected) => (list) => (
    Promise.all(
        list.map(async (dirent) => {
            if (dirent.isDirectory()) {
                list.push(
                    (await collectFiles(
                        resolvePath(directory, dirent.name),
                        collected
                    ))
                );
            }
            return dirent;
        })
    )
);

const mapFile = (directory) => list => (
    list.map(({ name }) => resolvePath(directory, name))
);

const collectFiles = async (directory, collected = []) => {
    const inputDirectory = await fs.readdir(
        resolvePath(directory),
        {
            withFileTypes: true
        }
    );

    const actions = [
        recurseSubDirectory(directory, collected),
        filterFiles(".md"),
        mapFile(directory),
    ];

    const files = await actions.reduce(
        async (list, action) => (
            action(await list)
        ),
        inputDirectory
    );
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
