#! /usr/bin/env node

import * as path from "path";
import * as fs from "fs";
import execSh from "exec-sh";

if (process.argv[2]) {
    const command = process.argv[2];

    if (command === 'update' || command === 'upgrade') {

        execSh("npm i -g aws-partition --registry=https://registry.npmjs.org",
            {cwd: "/home"},
            function (err, out) {
                if (err) {
                    console.error(err.message);
                }
            });

        process.exit(0);
    }

    if (command === 'version' || command === '-v') {
        const json = JSON.parse(fs.readFileSync('../package.json', {encoding: 'utf8'}));
        console.info(`aws-partition version: ${json.version}`);
        process.exit(0);
    }

    console.info('unknown command');
    process.exit(-1);
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
walk(`${process.env.PWD}/node_modules/@serverless-stack`)
    .forEach(file => sst(file));
