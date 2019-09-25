#!/usr/bin/env node

import { execSync } from 'child_process';

import { AbiEncoder, abiUtils, logUtils } from '@0x/utils';
import chalk from 'chalk';
import * as changeCase from 'change-case';
import * as cliFormat from 'cli-format';
import {
    AbiDefinition,
    ConstructorAbi,
    ContractAbi,
    DataItem,
    DevdocOutput,
    EventAbi,
    MethodAbi,
} from 'ethereum-types';
import { sync as globSync } from 'glob';
import * as Handlebars from 'handlebars';
import * as _ from 'lodash';
import * as mkdirp from 'mkdirp';
import toposort = require('toposort');
import * as yargs from 'yargs';

import { ContextData, ContractsBackend, ParamKind } from './types';
import { utils } from './utils';

const ABI_TYPE_CONSTRUCTOR = 'constructor';
const ABI_TYPE_METHOD = 'function';
const ABI_TYPE_EVENT = 'event';
const DEFAULT_NETWORK_ID = 50;
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
    .option('network-id', {
        describe: 'ID of the network where contract ABIs are nested in artifacts',
        type: 'number',
        default: DEFAULT_NETWORK_ID,
    })
    .option('language', {
        describe: 'Language of output file to generate',
        type: 'string',
        choices: ['TypeScript', 'Python'],
        default: 'TypeScript',
    })
    .example(
        "$0 --abis 'src/artifacts/**/*.json' --out 'src/contracts/generated/' --partials 'src/templates/partials/**/*.handlebars' --template 'src/templates/contract.handlebars'",
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

function registerPythonHelpers(): void {
    Handlebars.registerHelper('equal', (lhs: any, rhs: any) => {
        return lhs === rhs;
    });
    Handlebars.registerHelper('safeString', (str: string) => new Handlebars.SafeString(str));
    Handlebars.registerHelper('parameterType', utils.solTypeToPyType.bind(utils));
    Handlebars.registerHelper('returnType', utils.solTypeToPyType.bind(utils));
    Handlebars.registerHelper('toPythonIdentifier', utils.toPythonIdentifier.bind(utils));
    Handlebars.registerHelper('sanitizeDevdocDetails', (_methodName: string, devdocDetails: string, indent: number) => {
        // wrap to 80 columns, assuming given indent, so that generated
        // docstrings can pass pycodestyle checks.  also, replace repeated
        // spaces, likely caused by leading indents in the Solidity, because
        // they cause repeated spaces in the output, and in particular they may
        // cause repeated spaces at the beginning of a line in the docstring,
        // which leads to "unexpected indent" errors when generating
        // documentation.
        if (devdocDetails === undefined || devdocDetails.length === 0) {
            return '';
        }
        const columnsPerRow = 80;
        return new Handlebars.SafeString(
            `\n${cliFormat.wrap(devdocDetails.replace(/  +/g, ' ') || '', {
                paddingLeft: ' '.repeat(indent),
                width: columnsPerRow,
                ansi: false,
            })}\n`,
        );
    });
    Handlebars.registerHelper('makeParameterDocstringRole', (name: string, description: string, indent: number) => {
        let docstring = `:param ${name}:`;
        if (description && description.length > 0) {
            docstring = `${docstring} ${description}`;
        }
        return new Handlebars.SafeString(utils.wrapPythonDocstringRole(docstring, indent));
    });
    Handlebars.registerHelper(
        'makeReturnDocstringRole',
        (description: string, indent: number) =>
            new Handlebars.SafeString(
                utils.wrapPythonDocstringRole(`:returns: ${description.replace(/  +/g, ' ')}`, indent),
            ),
    );
    Handlebars.registerHelper(
        'makeEventParameterDocstringRole',
        (eventName: string, indent: number) =>
            new Handlebars.SafeString(
                utils.wrapPythonDocstringRole(
                    `:param tx_hash: hash of transaction emitting ${eventName} event`,
                    indent,
                ),
            ),
    );
    Handlebars.registerHelper('tupleDefinitions', (abisJSON: string) => {
        const abis: AbiDefinition[] = JSON.parse(abisJSON);
        // build an array of objects, each of which has one key, the Python
        // name of a tuple, with a string value holding the body of a Python
        // class representing that tuple. Using a key-value object conveniently
        // filters duplicate references to the same tuple.
        const tupleBodies: { [pythonTupleName: string]: string } = {};
        // build an array of tuple dependencies, whose format conforms to the
        // expected input to toposort, a function to do a topological sort,
        // which will help us declare tuples in the proper order, avoiding
        // references to tuples that haven't been declared yet.
        const tupleDependencies: Array<[string, string]> = [];
        for (const abi of abis) {
            let parameters: DataItem[] = [];
            if (abi.hasOwnProperty('inputs')) {
                // HACK(feuGeneA): using "as MethodAbi" below, but abi
                // could just as well be ConstructorAbi, EventAbi, etc.  We
                // just need to tell the TypeScript compiler that it's NOT
                // FallbackAbi, or else it would complain, "Property
                // 'inputs' does not exist on type 'AbiDefinition'.
                // Property 'inputs' does not exist on type
                // 'FallbackAbi'.", despite the enclosing if statement.
                // tslint:disable:no-unnecessary-type-assertion
                parameters = parameters.concat((abi as MethodAbi).inputs);
            }
            if (abi.hasOwnProperty('outputs')) {
                // HACK(feuGeneA): same as described above, except here we
                // KNOW that it's a MethodAbi, given the enclosing if
                // statement, because that's the only AbiDefinition subtype
                // that actually has an outputs field.
                parameters = parameters.concat((abi as MethodAbi).outputs);
            }
            for (const parameter of parameters) {
                utils.extractTuples(parameter, tupleBodies, tupleDependencies);
            }
        }
        // build up a list of tuples to declare. the order they're pushed into
        // this array is the order they will be declared.
        const tuplesToDeclare = [];
        // first push the ones that have dependencies
        tuplesToDeclare.push(...toposort(tupleDependencies));
        // then push any remaining bodies (the ones that DON'T have
        // dependencies)
        for (const pythonTupleName in tupleBodies) {
            if (!tuplesToDeclare.includes(pythonTupleName)) {
                tuplesToDeclare.push(pythonTupleName);
            }
        }
        // now iterate over those ordered tuples-to-declare, and prefix the
        // corresponding class bodies with their class headers, to form full
        // class declarations.
        const tupleDeclarations = [];
        for (const pythonTupleName of tuplesToDeclare) {
            if (tupleBodies[pythonTupleName]) {
                tupleDeclarations.push(
                    `class ${pythonTupleName}(TypedDict):\n    """Python representation of a tuple or struct.\n\n    Solidity compiler output does not include the names of structs that appear\n    in method definitions.  A tuple found in an ABI may have been written in\n    Solidity as a literal, anonymous tuple, or it may have been written as a\n    named \`struct\`:code:, but there is no way to tell from the compiler\n    output.  This class represents a tuple that appeared in a method\n    definition.  Its name is derived from a hash of that tuple's field names,\n    and every method whose ABI refers to a tuple with that same list of field\n    names will have a generated wrapper method that refers to this class.\n\n    Any members of type \`bytes\`:code: should be encoded as UTF-8, which can be\n    accomplished via \`str.encode("utf_8")\`:code:\n    """${
                        tupleBodies[pythonTupleName]
                    }`,
                );
            }
        }
        // finally, join the class declarations together for the output file
        return new Handlebars.SafeString(tupleDeclarations.join('\n\n\n'));
    });
    Handlebars.registerHelper('docBytesIfNecessary', (abisJSON: string) => {
        const abis: AbiDefinition[] = JSON.parse(abisJSON);
        // see if any ABIs accept params of type bytes, and if so then emit
        // explanatory documentation string.
        for (const abi of abis) {
            if (abi.hasOwnProperty('inputs')) {
                // HACK(feuGeneA): using "as MethodAbi" below, but abi
                // could just as well be ConstructorAbi, EventAbi, etc.  We
                // just need to tell the TypeScript compiler that it's NOT
                // FallbackAbi, or else it would complain, "Property
                // 'inputs' does not exist on type 'AbiDefinition'.
                // Property 'inputs' does not exist on type
                // 'FallbackAbi'.", despite the enclosing if statement.
                // tslint:disable:no-unnecessary-type-assertion
                if ((abi as MethodAbi).inputs) {
                    for (const input of (abi as MethodAbi).inputs) {
                        if (input.type === 'bytes') {
                            return new Handlebars.SafeString(
                                '\n\n    All method parameters of type `bytes`:code: should be encoded as UTF-8,\n    which can be accomplished via `str.encode("utf_8")`:code:.\n    ',
                            );
                        }
                    }
                }
            }
        }
        return '';
    });
    Handlebars.registerHelper(
        'toPythonClassname',
        (sourceName: string) => new Handlebars.SafeString(changeCase.pascal(sourceName)),
    );
}
if (args.language === 'TypeScript') {
    registerTypeScriptHelpers();
} else if (args.language === 'Python') {
    registerPythonHelpers();
}
registerPartials();

function makeLanguageSpecificName(methodName: string): string {
    return args.language === 'Python' ? changeCase.snake(methodName) : methodName;
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

    const contextData = {
        contractName: namedContent.name,
        ctor,
        deployedBytecode,
        ABI: ABI as ContractAbi,
        ABIString: JSON.stringify(ABI),
        methods: methodsData,
        events: eventsData,
    };
    const renderedCode = template(contextData);
    utils.writeOutputFile(outFilePath, renderedCode);

    if (args.language === 'Python') {
        // use command-line tool black to reformat, if its available
        try {
            execSync(`black --line-length 79 ${outFilePath}`);
        } catch {
            logUtils.warn(
                'Failed to reformat generated Python with black. Do you have it installed? Proceeding anyways...',
            );
        }
    }

    logUtils.log(`Created: ${chalk.bold(outFilePath)}`);
}
