#!/usr/bin/env node

// solc_cli.ts: a command-line solc interface, serving JSON over stdin/stdout,
// to be called via child_process.spawn(), resolving dependencies per compiler
// configuration.

import * as fs from 'fs';
import * as path from 'path';

import * as _ from 'lodash';
import * as requireFromString from 'require-from-string';
import * as yargs from 'yargs';

import * as solc from 'solc';

import { constructResolver } from './compiler';

(async () => {
    const argv = yargs
        .option('fullSolcVersion', {
            type: 'string',
            description: 'full solidity compiler version',
        })
        .option('solcBinDir', {
            type: 'string',
            description: 'directory holding solc binary',
        })
        .option('contractsDir', {
            type: 'string',
            description: 'directory holding contracts, for dependency resolution',
        })
        .help().argv;

    const compilerBinFilename = path.join(argv.solcBinDir, argv.fullSolcVersion);

    process.stdout.write(
        solc
            .setupMethods(requireFromString(fs.readFileSync(compilerBinFilename).toString(), compilerBinFilename))
            .compileStandardWrapper(fs.readFileSync(0 /* stdout */).toString(), importPath => {
                // resolve dependency on importPath
                const sourceCodeIfExists = constructResolver(argv.contractsDir).resolve(importPath);
                let source: string;
                if (_.isUndefined(sourceCodeIfExists)) {
                    process.stderr.write(`Could not resolve import path ${importPath}`);
                    source = '';
                } else {
                    source = sourceCodeIfExists.source;
                }
                return { contents: source };
            }),
    );

    const stdoutClosed = new Promise<void>(resolve => {
        process.stdout.on('finish', () => {
            resolve();
        });
    });

    const stderrClosed = new Promise<void>(resolve => {
        process.stderr.on('finish', () => {
            resolve();
        });
    });

    await Promise.all([stdoutClosed, stderrClosed]);

    process.exit(0);
})().catch(err => {
    throw err;
});
