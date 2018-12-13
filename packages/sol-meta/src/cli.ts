import 'source-map-support/register';

import { logUtils } from '@0x/utils';
import * as _ from 'lodash';
import * as pathUtils from 'path';
import * as process from 'process';
import * as yargs from 'yargs';

import { ContractMockOptions, mockContract, mockContractName } from './contract_mocker';
import { compile } from './solc_wrapper';
import { readSources, SourceReaderOptions } from './source_reader';
import { unparse } from './unparser';
import * as utils from './utils';
import { visit } from './visitor';

(async () => {
    // Parse command line arguments and handle help
    const argv = yargs
        .usage('Usage: $0 <sources> [options]')
        .help()
        .option('config', {
            type: 'string',
            description: 'path to config file',
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
        .options('shouldTest', {
            type: 'boolean',
            description: 'run all generated mock contracts through solc',
        }).argv;

    // TODO(recmo): Refactor to use a typed CommandLineOptions object
    let options: Partial<SourceReaderOptions> = {};
    const defaults: ContractMockOptions = {
        constructors: {},
        scripted: {},
    };
    let contracts: { [contractName: string]: ContractMockOptions } = {};
    const outputPath = `${process.cwd()}/out`;

    // Handle config file
    if (!_.isUndefined(argv.config)) {
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
    if (!_.isUndefined(argv.remapping)) {
        options.remapping = _.reduce<string[], {}>(
            _.map(argv.remapping as string[], (str: string) => str.split('=', 2)),
            (remappingsAccumulator, [from, to]) => ({ ...remappingsAccumulator, [from]: to }),
            {},
        );
    }
    if (!_.isUndefined(argv.includes)) {
        options.includes = argv.includes;
    }

    // Sources can be passed as --sources or as default argument `argv._`
    options.sources = [...options.sources, ...argv._];

    // Parse all sources
    const sources = await readSources(options.sources, options);

    for (const contractName of _.keys(contracts)) {
        logUtils.log(`\n${contractName}`);
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
        const contractPath = _.find(_.keys(sources), path => contractName in sources[path].contracts);
        if (_.isUndefined(contractPath)) {
            throw new Error(`Could not find contract ${contractName}.`);
        }

        // Create mock contract
        const mock = mockContract(sources, contractPath, contractName, spec);

        // Optionally test
        if (!_.isUndefined(argv.test)) {
            await compile(sources, mock);
        }

        // Make import paths relative
        mock.children = _.map(mock.children, node =>
            visit(node, {
                ImportDirective: importDirective => ({
                    ...importDirective,
                    path: pathUtils.relative(outputPath, importDirective.path),
                }),
                SourceMember: n => n,
            }),
        );

        // Write file
        await utils.writeFileAsync(`${outputPath}/${mockContractName(contractName)}.sol`, unparse(mock));
    }

    // Exit successfully
    process.exit(0);

    // Catch errors, log and exit with failure
})().catch(err => {
    // tslint:disable-next-line:no-console
    console.error(err);
    process.exit(1);
});
