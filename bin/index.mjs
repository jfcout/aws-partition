#! /usr/bin/env node

import * as path from "path";
import * as fs from "fs";

if (!process.argv[2]) {
    throw new Error("Must input AWS partition");
}

const partition = process.argv[2];

if (partition !== "aws" && partition !== 'aws-cn') {
    throw new Error("The AWS partition must be 'aws' or 'aws-cn'");
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

    let newContent = oldContent.replaceAll(
        'arn:aws:ssm:${app.region}',
        'arn:${app.region.startsWith(\'cn\') ? \'aws-cn\' : \'aws\'}:ssm:${app.region}'
    );

    // newContent = newContent.replaceAll(
    //     'arn:aws:execute-api:${region}',
    //     'arn:${region.startsWith(\'cn\') ? \'aws-cn\' : \'aws\'}:execute-api:${region}'
    // );

    // newContent = newContent.replaceAll(
    //     'arn:aws:appsync:${region}',
    //     'arn:${region.startsWith(\'cn\') ? \'aws-cn\' : \'aws\'}:appsync:${region}'
    // );
    //
    // newContent = newContent.replaceAll(
    //     'arn:aws:s3:::${app.bootstrapAssets.bucketName}',
    //     'arn:${app.region.startsWith(\'cn\') ? \'aws-cn\' : \'aws\'}:s3:::${app.bootstrapAssets.bucketName}'
    // );

    // newContent = newContent.replaceAll(
    //     `"arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"`,
    //     "`arn:${this.node.root.region.startsWith('cn')?'aws-cn':'aws'}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`"
    // );

    newContent = newContent.replaceAll(
        `arn:${old_partition}:`,
        `arn:${partition}:`
    );

    // arn:aws-cn:ssm:${app.region}
    if (oldContent.toString() !== newContent.toString()) {
        fs.writeFileSync(filePath, newContent, {encoding: 'utf-8'});
        console.info(`${filePath} Updated`);
    }
};

const dir = `${process.env.PWD}/node_modules/@serverless-stack`;
walk(dir).forEach(filePath => updatePartition(partition, filePath));

console.info(`Your AWS partition has been switched to: ${partition}`);
