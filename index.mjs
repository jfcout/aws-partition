#! /usr/bin/env node

import * as path from "path";
import * as fs from "fs";
import execSh from "exec-sh";
import chalk from 'chalk';

const warning = chalk.hex('#EC7211');
const log = console.log;

const version = () => {
    log(warning('aws-partition') + ' current version: ' + chalk.green('0.0.34'));
};

const command = process.argv[2];
const node_path = process.argv[3] ? process.argv[3] : './node_modules';
const commands = ['aws', 'aws-cn', 'aws-us-gov', 'aws-iso', 'aws-iso-b', 'update', 'version'];

if (!commands.includes(command)) {
    version();
    console.info('The command can only be one of ' + chalk.blue(commands.join('|' +
        '')));
    process.exit(-1);
}

if (command === 'update') {
    version();
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

const formats = ['ts', 'mjs', 'js', 'json'];

log(warning('aws-partition') + ' partition: ' + chalk.green(command));
log(warning('aws-partition') + ' node_path: ' + chalk.green(node_path));

const walk = (dir) => {
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
            if (formats.includes(file.split('.').pop())) {
                results.push(file);
            }
        }
    });

    return results;
};

const sst = (file) => {

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

    let newContent = oldContent.replaceAll(
        /arn:(aws|aws-cn|aws-us-gov|aws-iso|aws-iso-b):/g,
        `arn:${command}:`
    );

    newContent = newContent.replaceAll(
        /project.config.region\?.startsWith\("us-gov-"\)/g,
        `(project.config.region?.startsWith("us-gov-") || project.config.region?.startsWith("cn-"))`
    );

    const tag_code = 'cdk.Tags.of(child).add("sst:';
    const tag_code_no = '// cdk-bak.Tags.of(child).add("sst:';
    if (command === 'aws-cn') {
        newContent = newContent.replaceAll(tag_code, tag_code_no);
    } else {
        newContent = newContent.replaceAll(tag_code_no, tag_code);
    }

    if (oldContent.toString() !== newContent.toString()) {
        fs.writeFileSync(file, newContent, {encoding: 'utf-8'});
        console.info(`${file} Updated`);
    }
};

if (fs.existsSync(node_path)) {
    console.info(warning('aws-partition') + ' Start');
    walk(node_path)
        .forEach(file => sst(file));
    console.info(warning('aws-partition') + ' Done');
}
