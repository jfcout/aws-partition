#! /usr/bin/env node

import * as path from "path";
import * as fs from "fs";

if (!process.argv[2]) {
    throw new Error("Must input AWS partition");
}

const partition = process.argv[2];

const partitions = [
    'aws',
    'aws-cn',
    'aws-us-gov',
    'aws-iso',
    'aws-iso-b',
];

if (!partitions.includes(partition)) {
    throw new Error(`The AWS partition must be in ${partitions.join(', ')}`);
}

const walk = dir => {
    let results = [];

    if (!fs.existsSync(dir)) {
        console.info(`No SST detected in: ${dir}`);
        return results;
    }

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

const sst = (partition, file) => {

    if (!file.endsWith("ts") && !file.endsWith("mjs") && !file.endsWith("js")) {
        return;
    }

    const oldContent = fs.readFileSync(file, {encoding: 'utf8'});

    let newContent = oldContent.replaceAll(
        /arn:(aws|aws-cn|aws-us-gov|aws-iso|aws-iso-b):ssm:\${app.region}/g,
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

    // *Pattern* : `^arn:(aws|aws-cn|aws-us-gov|aws-iso|aws-iso-b):ec2:[a-z\-0-9]*:[0-9]{12}:security-group/.*$`

    newContent = newContent.replaceAll(
        /arn:(aws|aws-cn|aws-us-gov|aws-iso|aws-iso-b):/g,
        `arn:${partition}:`
    );

    // arn:aws-cn:ssm:${app.region}
    if (oldContent.toString() !== newContent.toString()) {
        fs.writeFileSync(file, newContent, {encoding: 'utf-8'});
        console.info(`${file} Updated`);
    }
};

// for sst
walk(`${process.env.PWD}/node_modules/@serverless-stack`)
    .forEach(file => sst(partition, file));

// for other...

// console.info(`AWS Partition has been switched to: ${partition}`);
