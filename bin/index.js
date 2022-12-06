#! /usr/bin/env node

import * as path from "path";
import * as fs from "fs";

if (!process.argv[2]) {
    throw new Error("Must input aws partition");
}

const partition = process.argv[2];

if (partition !== "aws" && partition !== 'aws-cn') {
    throw new Error("The aws partition must be 'aws' or 'aws-cn'");
}

const walk = dir => {
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
};
const updatePartition = (partition, filePath) => {
    if (!filePath.endsWith("ts") && !filePath.endsWith("mjs") && !filePath.endsWith("js")) {
        return;
    }
    const old_partition = partition === 'aws' ? 'aws-cn' : 'aws';
    const oldContent = fs.readFileSync(filePath, {encoding: 'utf8'});
    const newContent = oldContent.replaceAll(
        `arn:${old_partition}:`,
        `arn:${partition}:`
    );
    if (oldContent.toString() !== newContent.toString()) {
        fs.writeFileSync(filePath, newContent, {encoding: 'utf-8'});
        console.log(`${filePath} Updated`);
    }
};

const dir = `${process.env.PWD}/node_modules/@serverless-stack`;
walk(dir).forEach(filePath => updatePartition(partition, filePath));
