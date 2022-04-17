#!/usr/bin/env node
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
const {transform, commands, supportedEncodings} = require('../lib/receiptline.js');
const {statSync, readFileSync, writeFileSync, existsSync} = require('fs');
const {basename, dirname} = require('path');
var sharp = null;
try {
    sharp = require('sharp');
} catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
        // pass
    } else {
        throw e;
    }
}

const sharpFormats = [
    'heic',
    'heif',
    'avif',
    'jpeg',
    'jpg',
    'png',
    'raw',
    'tiff',
    'tif',
    'webp',
    'gif',
    'jp2',
    'jpx',
    'j2k',
    'j2c',
];

/**
 * Function - readStdin
 * Read text from stdin
 * @returns {string} contents of stdin
 */
async function readStdin() {
    const buffers = [];
    for await (const chunk of process.stdin) buffers.push(chunk);
    const buffer = Buffer.concat(buffers);
    return buffer.toString();
}

/**
 * Function - checkRange
 * (Helper function for CLI) Generate a function
 * to parse a numeric argument and check the range
 * @param {string} name name of argument
 * @param {function(string): number} f function of parsing string as number
 * @param {number} min min of valid range
 * @param {number} max max of valid range
 * @returns {function(string, number): number} parser and checker for cmd arguments
 */
function checkRange(name, f, min, max) {
    return (v, _) => {
        let i = f(v);
        if (min <= i && i <= max) {
            return i;
        } else {
            throw new InvalidArgumentError(
                `Invalid ${name} (expected ${min}<=${name[0]}<=${max}, got ${i})`
            );
        }
    };
}

(async () => {
    // setup cli parser
    const program = new Command('receiptline');
    program
        .description('Receiptline CLI')
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
            checkRange('cpl', parseInt, 24, 48),
            48
        )
        .addOption(
            new Option('-e, --encoding <encoding>', 'encoding')
                .default('cp437')
                .choices(supportedEncodings)
        )
        .option('-u, --upside-down', 'upside down')
        .option('-s, --spacing', 'line spacing')
        .option('-c, --no-cutting', 'no paper cutting')
        .option('-G, --gradient', 'image processing for photos')
        .option(
            '-g, --gamma <number>',
            'image gamma correction (0.1-10.0)',
            checkRange('gamma', parseFloat, 0.1, 10.0),
            1.8
        )
        .option(
            '-b, --threshold <number>',
            'image thresholding (0-255)',
            checkRange('threshold', parseInt, 0, 255),
            128
        )
        .addOption(
            new Option('-p, --printer <command>', 'printer control language')
                .default('svg')
                .choices(
                    (() => {
                        if (sharp) {
                            return Object.getOwnPropertyNames(commands).concat(
                                sharpFormats
                            );
                        } else {
                            return Object.getOwnPropertyNames(commands);
                        }
                    })()
                )
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

    // parse cmd arguments
    program.parse();
    const opts = program.opts();
    const args = program.args;
    const argn = args.length;
    const needSharp = sharpFormats.includes(opts.printer);

    // receive input
    var doc = '';
    if (argn === 0) {
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

    // setup printer
    const printer = {
        cpl: opts.cpl,
        encoding: opts.encoding,
        upsideDown: !!opts.upsideDown,
        spacing: !!opts.spacing,
        cutting: !opts.noCutting,
        gradient: opts.cutting,
        gamma: opts.gamma,
        threshold: opts.threshold,
        command: needSharp ? 'svg' : opts.printer,
    };

    // get result of transformming
    var result = transform(doc, printer);
    if (needSharp) {
        // convert svg into image
        result = await sharp(Buffer.from(result))
            .toFormat(opts.printer)
            .toBuffer();
    }

    if (opts.output === undefined) {
        // print result to stdout when not being specified
        console.log(result.toString());
    } else {
        // print result to specified file
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
})();
