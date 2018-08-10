#!/usr/bin/env node
// We need the above pragma since this script will be run as a command-line tool.

import * as fs from 'fs';
import * as path from 'path';

import * as _ from 'lodash';
import * as requireFromString from 'require-from-string';
import * as yargs from 'yargs';

import * as solc from 'solc';

import { Resolver } from '@0xproject/sol-resolver';
import { fetchAsync } from '@0xproject/utils';

import { constructResolver } from './compiler';
import { constants } from './constants';

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
    let solcjs: string;
    const isCompilerAvailableLocally = fs.existsSync(compilerBinFilename);
    if (isCompilerAvailableLocally) {
        solcjs = fs.readFileSync(compilerBinFilename).toString();
    } else {
        process.stderr.write(`Downloading ${argv.fullSolcVersion}...`);
        const url = `${constants.BASE_COMPILER_URL}${argv.fullSolcVersion}`;
        const response = await fetchAsync(url);
        const SUCCESS_STATUS = 200;
        if (response.status !== SUCCESS_STATUS) {
            throw new Error(`Failed to load ${argv.fullSolcVersion}`);
        }
        solcjs = await response.text();
        fs.writeFileSync(compilerBinFilename, solcjs);
    }

    const resolver: Resolver = constructResolver(argv.contractsDir);
    process.stdout.write(
        solc
            .setupMethods(requireFromString(solcjs, compilerBinFilename))
            .compileStandardWrapper(fs.readFileSync(0 /* stdout */).toString(), importPath => {
                // resolve dependency on importPath
                const sourceCodeIfExists = resolver.resolve(importPath);
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
