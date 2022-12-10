#! /usr/bin/env node

import * as path from "path";
import * as fs from "fs";
import execSh from "exec-sh";

const version = () => {
    console.info(`aws-partition version: 0.0.19`);
};

if (!process.argv[2]) {
    console.info('Must input command');
    process.exit(-1);
}

const command = process.argv[2];

if (command === 'update' || command === 'upgrade') {
    execSh("npm i -g aws-partition --registry=https://registry.npmjs.org",
        {},
        function (err, out) {
            if (err) {
                console.error(err.message);
            }
        });
    version();
    process.exit(0);
}

if (command === 'version' || command === '-v') {
    version();
    process.exit(0);
}

const partitions = ['aws', 'aws-cn', 'aws-us-gov', 'aws-iso', 'aws-iso-b'];

if (!partitions.includes(process.argv[2])) {
    console.info('Partition must be one of: ' + partitions.join(', '));
    process.exit(-1);
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

const sst = (file) => {

    if (!file.endsWith("ts") && !file.endsWith("mjs") && !file.endsWith("js")) {
        return;
    }

    const oldContent = fs.readFileSync(file, {encoding: 'utf8'});

    // const newContent = oldContent.replaceAll(
    //     '"arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"',
    //     "`arn:${['aws-cn', 'aws-us-gov', 'aws-iso', 'aws-iso-b'].includes(process.env.AWS_PARTITION) ? process.env.AWS_PARTITION : 'aws'}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`"
    // ).replaceAll(
    //     /arn:(aws|aws-cn|aws-us-gov|aws-iso|aws-iso-b):/g,
    //     "arn:${['aws-cn', 'aws-us-gov', 'aws-iso', 'aws-iso-b'].includes(process.env.AWS_PARTITION) ? process.env.AWS_PARTITION : 'aws'}:"
    // ).replaceAll(
    //     'cdk.Tags.of(child).add("sst:',
    //     '// cdk-bak.Tags.of(child).add("sst:'
    // );

    const newContent = oldContent.replaceAll(
        /arn:(aws|aws-cn|aws-us-gov|aws-iso|aws-iso-b):/g,
        `arn:${command}:`
    ).replaceAll(
        'cdk.Tags.of(child).add("sst:',
        '// cdk-bak.Tags.of(child).add("sst:'
    );

    if (oldContent.toString() !== newContent.toString()) {
        fs.writeFileSync(file, newContent, {encoding: 'utf-8'});
        console.info(`${file} Updated`);
    }
};

// for sst
const sst_path = './node_modules/@serverless-stack';

if (fs.existsSync(sst_path)) {
    console.info('SST Found');
    walk(sst_path)
        .forEach(file => sst(file));
    console.info('SST Done');
}
