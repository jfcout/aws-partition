#! /usr/bin/env node

import * as path from "path";
import * as fs from "fs";

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

const sst = (file) => {

    if (!file.endsWith("ts") && !file.endsWith("mjs") && !file.endsWith("js")) {
        return;
    }

    const oldContent = fs.readFileSync(file, {encoding: 'utf8'});

    const newContent = oldContent.replaceAll(
        '"arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"',
        "`arn:${['aws-cn', 'aws-us-gov', 'aws-iso', 'aws-iso-b'].includes(process.env.AWS_PARTITION) ? process.env.AWS_PARTITION : 'aws'}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`"
    ).replaceAll(
        /arn:(aws|aws-cn|aws-us-gov|aws-iso|aws-iso-b):/g,
        "arn:${['aws-cn', 'aws-us-gov', 'aws-iso', 'aws-iso-b'].includes(process.env.AWS_PARTITION) ? process.env.AWS_PARTITION : 'aws'}:"
    );

    if (oldContent.toString() !== newContent.toString()) {
        fs.writeFileSync(file, newContent, {encoding: 'utf-8'});
        console.info(`${file} Updated`);
    }
};

// for sst
walk(`${process.env.PWD}/node_modules/@serverless-stack`)
    .forEach(file => sst(file));
