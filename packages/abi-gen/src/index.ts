#!/usr/bin/env node
import { AbiEncoder, abiUtils, logUtils } from '@0x/utils';
import chalk from 'chalk';
import * as changeCase from 'change-case';
import { execSync } from 'child_process';
import * as cliFormat from 'cli-format';
import { AbiDefinition, ConstructorAbi, ContractAbi, DevdocOutput, EventAbi, MethodAbi } from 'ethereum-types';
import { sync as globSync } from 'glob';
import * as Handlebars from 'handlebars';
import * as _ from 'lodash';
import * as mkdirp from 'mkdirp';
import * as yargs from 'yargs';

import { registerPythonHelpers } from './python_handlebars_helpers';
import { ContextData, ContractsBackend, ParamKind } from './types';
import { utils } from './utils';

const ABI_TYPE_CONSTRUCTOR = 'constructor';
const ABI_TYPE_METHOD = 'function';
const ABI_TYPE_EVENT = 'event';
const DEFAULT_CHAIN_ID = 1337;
const DEFAULT_BACKEND = 'web3';

const args = yargs
    .option('abis', {
        describe: 'Glob pattern to search for ABI JSON files',
        type: 'string',
        demandOption: true,
    })
    .option('output', {
        alias: ['o', 'out'],
        describe: 'Folder where to put the output files',
        type: 'string',
        normalize: true,
        demandOption: true,
    })
    .option('partials', {
        describe: 'Glob pattern for the partial template files',
        type: 'string',
        implies: 'template',
    })
    .option('template', {
        describe:
            'Path for the main template file that will be used to generate each contract. Default templates are used based on the --language parameter.',
        type: 'string',
        normalize: true,
    })
    .option('backend', {
        describe: `The backing Ethereum library your app uses. For TypeScript, either 'web3' or 'ethers'. Ethers auto-converts small ints to numbers whereas Web3 doesn't. For Python, the only possibility is Web3.py`,
        type: 'string',
        choices: [ContractsBackend.Web3, ContractsBackend.Ethers],
        default: DEFAULT_BACKEND,
    })
    .option('chain-id', {
        describe: 'ID of the chain where contract ABIs are nested in artifacts',
        type: 'number',
        default: DEFAULT_CHAIN_ID,
    })
    .option('language', {
        describe: 'Language of output file to generate',
        type: 'string',
        choices: ['TypeScript', 'Python'],
        default: 'TypeScript',
    })
    .example(
        "$0 --abis 'src/artifacts/**/*.json' --out 'src/contracts/generated/' --debug --partials 'src/templates/partials/**/*.handlebars' --template 'src/templates/contract.handlebars'",
        'Full usage example',
    ).argv;

const templateFilename = args.template || `${__dirname}/../../templates/${args.language}/contract.handlebars`;
const mainTemplate = utils.getNamedContent(templateFilename);
const template = Handlebars.compile<ContextData>(mainTemplate.content);
const abiFileNames = globSync(args.abis);
const partialTemplateFileNames = globSync(
    args.partials || `${__dirname}/../../templates/${args.language}/partials/**/*.handlebars`,
);

function registerPartials(): void {
    logUtils.log(`Found ${chalk.green(`${partialTemplateFileNames.length}`)} ${chalk.bold('partial')} templates`);
    for (const partialTemplateFileName of partialTemplateFileNames) {
        const namedContent = utils.getNamedContent(partialTemplateFileName);
        Handlebars.registerPartial(namedContent.name, namedContent.content);
    }
}

function registerTypeScriptHelpers(): void {
    Handlebars.registerHelper('parameterType', utils.solTypeToTsType.bind(utils, ParamKind.Input, args.backend));
    Handlebars.registerHelper('assertionType', utils.solTypeToAssertion.bind(utils));
    Handlebars.registerHelper('returnType', utils.solTypeToTsType.bind(utils, ParamKind.Output, args.backend));

    Handlebars.registerHelper('ifEquals', function(this: typeof Handlebars, arg1: any, arg2: any, options: any): void {
        return arg1 === arg2 ? options.fn(this) : options.inverse(this); // tslint:disable-line:no-invalid-this
    });

    // Check if 0 or false exists
    Handlebars.registerHelper(
        'isDefined',
        (context: any): boolean => {
            return context !== undefined;
        },
    );

    // Format docstring for method description
    Handlebars.registerHelper(
        'formatDocstringForMethodTs',
        (docString: string): Handlebars.SafeString => {
            // preserve newlines
            const regex = /([ ]{4,})+/gi;
            const formatted = docString.replace(regex, '\n * ');
            return new Handlebars.SafeString(formatted);
        },
    );
    // Get docstring for method param
    Handlebars.registerHelper(
        'getDocstringForParamTs',
        (paramName: string, devdocParamsObj: { [name: string]: string }): Handlebars.SafeString | undefined => {
            if (devdocParamsObj === undefined || devdocParamsObj[paramName] === undefined) {
                return undefined;
            }
            return new Handlebars.SafeString(`${devdocParamsObj[paramName]}`);
        },
    );

    // Format docstring for method param
    Handlebars.registerHelper(
        'formatDocstringForParamTs',
        (paramName: string, desc: Handlebars.SafeString): Handlebars.SafeString => {
            const docString = `@param ${paramName} ${desc}`;
            const hangingIndentLength = 4;
            const config = {
                width: 80,
                paddingLeft: ' * ',
                hangingIndent: ' '.repeat(hangingIndentLength),
                ansi: false,
            };
            return new Handlebars.SafeString(`${cliFormat.wrap(docString, config)}`);
        },
    );
}

if (args.language === 'TypeScript') {
    registerTypeScriptHelpers();
} else if (args.language === 'Python') {
    registerPythonHelpers();
}
registerPartials();

function makeLanguageSpecificName(methodName: string): string {
    if (args.language === 'Python') {
        let snakeCased = changeCase.snake(methodName);
        // Move leading underscores to the end.
        const m = /^(_*).+?(_*)$/.exec(methodName);
        if (m) {
            snakeCased = `${snakeCased}${m[1] || m[2]}`;
        }
        return snakeCased;
    }
    return methodName;
}

if (_.isEmpty(abiFileNames)) {
    logUtils.log(`${chalk.red(`No ABI files found.`)}`);
    logUtils.log(`Please make sure you've passed the correct folder name and that the files have
               ${chalk.bold('*.json')} extensions`);
    process.exit(1);
} else {
    logUtils.log(`Found ${chalk.green(`${abiFileNames.length}`)} ${chalk.bold('ABI')} files`);
    mkdirp.sync(args.output);
}
for (const abiFileName of abiFileNames) {
    const namedContent = utils.getNamedContent(abiFileName);
    logUtils.log(`Processing: ${chalk.bold(namedContent.name)}...`);
    const parsedContent = JSON.parse(namedContent.content);
    let ABI;
    let devdoc: DevdocOutput;
    if (_.isArray(parsedContent)) {
        ABI = parsedContent; // ABI file
    } else if (parsedContent.abi !== undefined) {
        ABI = parsedContent.abi; // Truffle artifact
    } else if (parsedContent.compilerOutput.abi !== undefined) {
        ABI = parsedContent.compilerOutput.abi; // 0x artifact
        if (parsedContent.compilerOutput.devdoc !== undefined) {
            devdoc = parsedContent.compilerOutput.devdoc;
        }
    }
    if (ABI === undefined) {
        logUtils.log(`${chalk.red(`ABI not found in ${abiFileName}.`)}`);
        logUtils.log(
            `Please make sure your ABI file is either an array with ABI entries or a truffle artifact or 0x sol-compiler artifact`,
        );
        process.exit(1);
    }

    const outFileName = utils.makeOutputFileName(namedContent.name);
    const outFilePath = (() => {
        if (args.language === 'TypeScript') {
            return `${args.output}/${outFileName}.ts`;
        } else if (args.language === 'Python') {
            const directory = `${args.output}/${outFileName}`;
            mkdirp.sync(directory);
            return `${directory}/__init__.py`;
        } else {
            throw new Error(`Unexpected language '${args.language}'`);
        }
    })();

    if (utils.isOutputFileUpToDate(outFilePath, [abiFileName, templateFilename, ...partialTemplateFileNames])) {
        logUtils.log(`Already up to date: ${chalk.bold(outFilePath)}`);
        continue;
    }

    let deployedBytecode;
    try {
        deployedBytecode = parsedContent.compilerOutput.evm.deployedBytecode.object;
        if (
            deployedBytecode === '' ||
            deployedBytecode === undefined ||
            deployedBytecode === '0x' ||
            deployedBytecode === '0x00'
        ) {
            throw new Error();
        }
    } catch (err) {
        logUtils.log(
            `Couldn't find deployedBytecode for ${chalk.bold(
                namedContent.name,
            )}, using undefined. Found [${deployedBytecode}]`,
        );
        deployedBytecode = undefined;
    }
    let ctor = ABI.find((abi: AbiDefinition) => abi.type === ABI_TYPE_CONSTRUCTOR) as ConstructorAbi;
    if (ctor === undefined) {
        ctor = utils.getEmptyConstructor(); // The constructor exists, but it's implicit in JSON's ABI definition
    }

    const methodAbis = ABI.filter((abi: AbiDefinition) => abi.type === ABI_TYPE_METHOD) as MethodAbi[];
    const sanitizedMethodAbis = abiUtils.renameOverloadedMethods(methodAbis) as MethodAbi[];
    const methodsData = _.map(methodAbis, (methodAbi, methodAbiIndex: number) => {
        _.forEach(methodAbi.inputs, (input, inputIndex: number) => {
            if (_.isEmpty(input.name)) {
                // Auto-generated getters don't have parameter names
                input.name = `index_${inputIndex}`;
            }
        });
        const functionSignature = new AbiEncoder.Method(methodAbi).getSignature();
        const languageSpecificName: string = makeLanguageSpecificName(sanitizedMethodAbis[methodAbiIndex].name);
        // This will make templates simpler
        const methodData = {
            ...methodAbi,
            singleReturnValue: methodAbi.outputs.length === 1,
            hasReturnValue: methodAbi.outputs.length !== 0,
            languageSpecificName,
            functionSignature,
            devdoc: devdoc ? devdoc.methods[functionSignature] : undefined,
        };
        return methodData;
    });

    const eventAbis = ABI.filter((abi: AbiDefinition) => abi.type === ABI_TYPE_EVENT) as EventAbi[];
    const eventsData = _.map(eventAbis, (eventAbi, eventAbiIndex: number) => {
        const languageSpecificName = makeLanguageSpecificName(eventAbi.name);

        const eventData = {
            ...eventAbi,
            languageSpecificName,
        };
        return eventData;
    });

    const shouldIncludeBytecode = methodsData.find(methodData => methodData.stateMutability === 'pure') !== undefined;

    const contextData = {
        contractName: namedContent.name,
        ctor,
        deployedBytecode: shouldIncludeBytecode ? deployedBytecode : undefined,
        ABI: ABI as ContractAbi,
        ABIString: JSON.stringify(ABI),
        methods: methodsData,
        events: eventsData,
        debug: args.debug,
    };
    const renderedCode = template(contextData);
    utils.writeOutputFile(outFilePath, renderedCode);

    if (args.language === 'Python') {
        // use command-line tool black to reformat, if its available
        try {
            execSync(`black --line-length 79 ${outFilePath}`);
        } catch (e) {
            const BLACK_RC_CANNOT_PARSE = 123; // empirical black exit code
            if (e.status === BLACK_RC_CANNOT_PARSE) {
                logUtils.warn(
                    'Failed to reformat generated Python with black.  Exception thrown by execSync("black ...") follows.',
                );
                throw e;
            } else {
                logUtils.warn('Failed to invoke black. Do you have it installed? Proceeding anyways...');
            }
        }
    }

    logUtils.log(`Created: ${chalk.bold(outFilePath)}`);
}
