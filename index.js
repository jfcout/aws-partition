import * as path from "path";
import * as fs from "fs";

const walk = dir => {
    try {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                // Recurse into subdir
                results = [...results, ...walk(file)];
            } else {
                // Is a file
                results.push(file);
            }
        });
        return results;
    } catch (error) {
        console.error(`Error when walking dir ${dir}`, error);
    }
};
const updatePartition = (app, filePath) => {
    if (!filePath.endsWith("ts") && !filePath.endsWith("mjs") && !filePath.endsWith("js")) {
        return;
    }
    const old_partition = app.region.startsWith('cn-') ? 'aws' : 'aws-cn';
    const new_partition = app.region.startsWith('cn-') ? 'aws-cn' : 'aws';
    const oldContent = fs.readFileSync(filePath, {encoding: 'utf8'});
    const newContent = oldContent.replaceAll(
        `arn:${old_partition}:`,
        `arn:${new_partition}:`
    );
    if (oldContent.toString() !== newContent.toString()) {
        fs.writeFileSync(filePath, newContent, {encoding: 'utf-8'});
        console.log(`${filePath} updated`);
    }
};

export function Gcr(app) {
    const dir = `${process.env.PWD}/node_modules/@serverless-stack`;
    walk(dir).forEach(filePath => updatePartition(app, filePath));
}
