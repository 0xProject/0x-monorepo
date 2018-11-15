import 'source-map-support/register';

import * as pathUtils from 'path';
import * as process from 'process';
import * as S from 'solidity-parser-antlr';
import * as yargs from 'yargs';

import { ContractMockOptions, mockContract, mockContractName } from './contractMocker';
import { compile } from './solcWrapper';
import { readSources, SourceReaderOptions } from './source_reader';
import { unparse } from './unparser';
import * as utils from './utils';
import { visit, Visitor } from './visitor';

(async () => {
    // Parse command line arguments and handle help
    const argv = yargs
        .usage('Usage: $0 <sources> [options]')
        .help()
        .option('config', {
            type: 'string',
            description: 'config file',
        })
        .option('remapping', {
            type: 'string',
            array: true,
            description: 'path remappings for import statements',
        })
        .option('includes', {
            type: 'string',
            array: true,
            description: 'search paths for imported source files',
        })
        .option('output', {
            type: 'string',
            description: 'directory to output too',
        })
        .options('test', {
            type: 'boolean',
            description: 'run all generated mock contracts through solc',
        }).argv;

    // TODO: CommandLineOptions object
    let options: Partial<SourceReaderOptions> = {};
    let defaults: ContractMockOptions = {
        constructors: {},
        scripted: {},
    };
    let contracts: { [contractName: string]: ContractMockOptions } = {};
    let outputPath = `${process.cwd()}/out`;

    // Handle config file
    if (argv.config) {
        const config = JSON.parse(await utils.readFileAsync(argv.config));
        if (config.options) {
            options = { ...options, ...config.options };
        }
        if (config.constructors) {
            defaults.constructors = { ...defaults.constructors, ...config.constructors };
        }
        if (config.scripted) {
            defaults.scripted = { ...defaults.scripted, ...config.scripted };
        }
        if (config.contracts) {
            contracts = { ...contracts, ...config.contracts };
        }
    }

    // Handle command line arguments
    if (argv.remapping) {
        options.remapping = (argv.remapping as string[])
            .map((str: string) => str.split('=', 2))
            .reduce((a, [from, to]) => ({ ...a, [from]: to }), {});
    }
    if (argv.includes) {
        options.includes = argv.includes;
    }
    options.sources = [...options.sources, ...argv._];

    // Parse all sources
    console.time('Parsing sources');
    const sources = await readSources(options.sources, options);
    console.timeEnd('Parsing sources');

    for (const contractName in contracts) {
        if (contracts.hasOwnProperty(contractName)) {
            console.log(`\n${contractName}`);
            const spec = {
                constructors: {
                    ...defaults.constructors,
                    ...contracts[contractName].constructors,
                },
                scripted: {
                    ...defaults.scripted,
                    ...contracts[contractName].scripted,
                },
            };

            // Find path
            const path = Object.keys(sources).find(path => contractName in sources[path].contracts);
            if (path === undefined) {
                throw new Error(`Could not find contract ${contractName}.`);
            }

            // Create mock contract
            console.time('Generating mocks');
            const mock = mockContract(sources, path, contractName, spec);
            console.timeEnd('Generating mocks');

            // Optionally test
            if (argv.test) {
                console.time('Test compile');
                await compile(sources, mock);
                console.timeEnd('Test compile');
            }

            // Make import paths relative
            mock.children = mock.children.map(node =>
                visit(node, {
                    ImportDirective: importDirective => ({
                        ...importDirective,
                        path: pathUtils.relative(outputPath, importDirective.path),
                    }),
                    SourceMember: n => n,
                }),
            );

            // Write file
            console.time('Writing mocks');
            await utils.writeFileAsync(`${outputPath}/${mockContractName(contractName)}.sol`, unparse(mock));
            console.timeEnd('Writing mocks');
        }
    }

    // Exit successfully
    process.exit(0);

    // Catch errors, log and exit with failure
})().catch(err => {
    console.error(err);
    process.exit(1);
});
