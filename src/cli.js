/*
Copyright 2019 Open Foodservice System Consortium
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const {InvalidArgumentError, Command, Option} = require('commander');
const {transform, commands} = require('../lib/receiptline.js');
const {statSync, readFileSync, writeFileSync, existsSync} = require('fs');
const {basename, dirname} = require('path');

const encodings = [
    'multilingual',
    'cp437',
    'cp852',
    'cp858',
    'cp860',
    'cp863',
    'cp865',
    'cp866',
    'cp1252',
    'cp932',
    'shiftjis',
    'cp936',
    'gb18030',
    'cp949',
    'ksc5601',
    'cp950',
    'big5',
];

async function readStdin() {
    const buffers = [];
    for await (const chunk of process.stdin) buffers.push(chunk);
    const buffer = Buffer.concat(buffers);
    return buffer.toString();
}

module.exports = {
    cli: async () => {
        const program = new Command('receiptline');
        program
            .description('receiptline CLI')
            .version(
                'receiptline version 1.8.0\n' +
                    '(C) 2019-, Open Foodservice System Consortium\n' +
                    'Licensed under the Apache License, Version 2.0\n' +
                    'https://github.com/receiptline/receiptline'
            );
        program
            .option(
                '-c, --cpl <number>',
                'characters per line (24-48)',
                (v, _) => {
                    let i = parseInt(v);
                    if (24 <= i && i <= 48) {
                        return i;
                    } else {
                        throw new InvalidArgumentError(
                            `Invalid cpl (expected 24<=c<=48, got ${i})`
                        );
                    }
                },
                48
            )
            .addOption(
                new Option('-e, --encoding <encoding>', 'encoding')
                    .default('cp437')
                    .choices(encodings)
            )
            .option('-u, --upside-down', 'upside down')
            .option('-s, --spacing', 'line spacing')
            .option('-c, --no-cutting', 'no paper cutting')
            .option('-G, --gradient', 'image processing for photos')
            .option(
                '-g, --gamma <number>',
                'image gamma correction (0.1-10.0)',
                (v, _) => {
                    let f = parseFloat(v);
                    if (0.1 <= f && f <= 10.0) {
                        return f;
                    } else {
                        throw new InvalidArgumentError(
                            `Invalid gamma (expected 0.1<=g<=10.0, got ${f})`
                        );
                    }
                },
                1.8
            )
            .option(
                '-b, --threshold <number>',
                'image thresholding (0-255)',
                (v, _) => {
                    let i = parseInt(v);
                    if (0 <= i && i <= 255) {
                        return i;
                    } else {
                        throw new InvalidArgumentError(
                            `Invalid threshold (expected 0<=t<=255, got ${i})`
                        );
                    }
                },
                128
            )
            .addOption(
                new Option(
                    '-p, --printer <command>',
                    'printer control language'
                )
                    .default('svg')
                    .choices(Object.getOwnPropertyNames(commands))
            )
            .option(
                '-o, --output <path>',
                'output file (read stdin unless this option is not given)'
            )
            .argument('[source]', 'source file');
        program.configureHelp({
            helpWidth: 100,
            sortOptions: false,
            sortSubcommands: false,
        });

        program.parse();
        const opts = program.opts();
        const args = program.args;

        const argn = args.length;
        var doc = '';
        if (argn === 0) {
            // doc = await stringify(process.stdin);
            doc = await readStdin();
        } else if (argn === 1) {
            const f = args[0];
            if (statSync(f).isFile()) {
                doc = readFileSync(f, {encoding: 'utf-8'});
            } else {
                throw new InvalidArgumentError(
                    `Invalid source ('${argn}' is not file)`
                );
            }
        } else {
            throw new InvalidArgumentError(
                `Invalid source (expected 1, got ${argn})`
            );
        }
        const printer = {
            cpl: opts.cpl,
            encoding: opts.encoding,
            upsideDown: !!opts.upsideDown,
            spacing: !!opts.spacing,
            cutting: !opts.noCutting,
            gradient: opts.cutting,
            gamma: opts.gamma,
            threshold: opts.threshold,
            command: opts.printer,
        };
        const result = transform(doc, printer);
        if (opts.output === undefined) {
            console.log(result);
        } else {
            const outDir = dirname(opts.output);
            const outFile = basename(opts.output);
            if (
                outDir !== '.' &&
                (!existsSync(outFile) || !statSync(outDir).isDirectory())
            ) {
                throw new InvalidArgumentError(
                    `Invarid parent directory of output file ('${outDir}' is not a directory)`
                );
            } else if (
                outFile !== '' &&
                existsSync(outFile) &&
                statSync(outFile).isDirectory()
            ) {
                throw new InvalidArgumentError(
                    `Invarid output file ('${outFile}' is a directory)`
                );
            } else {
                writeFileSync(opts.output, result);
            }
        }
    },
};
