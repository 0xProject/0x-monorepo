#!/usr/bin/env node

import { AbiDefinition, ConstructorAbi, EventAbi, MethodAbi } from '@0xproject/types';
import { abiUtils, logUtils } from '@0xproject/utils';
import chalk from 'chalk';
import * as fs from 'fs';
import { sync as globSync } from 'glob';
import * as Handlebars from 'handlebars';
import * as _ from 'lodash';
import * as mkdirp from 'mkdirp';
import * as yargs from 'yargs';

import toSnakeCase = require('to-snake-case');

import { ContextData, ContractsBackend, Method, ParamKind } from './types';
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
        describe: 'Path for the main template file that will be used to generate each contract',
        type: 'string',
        demandOption: true,
        normalize: true,
    })
    .option('backend', {
        describe: `The backing Ethereum library your app uses. Either 'web3' or 'ethers'. Ethers auto-converts small ints to numbers whereas Web3 doesn't.`,
        type: 'string',
        choices: [ContractsBackend.Web3, ContractsBackend.Ethers],
        default: DEFAULT_BACKEND,
    })
    .option('network-id', {
        describe: 'ID of the network where contract ABIs are nested in artifacts',
        type: 'number',
        default: DEFAULT_NETWORK_ID,
    })
    .example(
        "$0 --abis 'src/artifacts/**/*.json' --out 'src/contracts/generated/' --partials 'src/templates/partials/**/*.handlebars' --template 'src/templates/contract.handlebars'",
        'Full usage example',
    ).argv;

function registerPartials(partialsGlob: string): void {
    const partialTemplateFileNames = globSync(partialsGlob);
    logUtils.log(`Found ${chalk.green(`${partialTemplateFileNames.length}`)} ${chalk.bold('partial')} templates`);
    for (const partialTemplateFileName of partialTemplateFileNames) {
        const namedContent = utils.getNamedContent(partialTemplateFileName);
        Handlebars.registerPartial(namedContent.name, namedContent.content);
    }
}

function writeOutputFile(name: string, renderedTsCode: string): void {
    let fileName = toSnakeCase(name);
    if (fileName === 'z_r_x_token') {
        fileName = 'zrx_token';
    }
    const filePath = `${args.output}/${fileName}.ts`;
    fs.writeFileSync(filePath, renderedTsCode);
    logUtils.log(`Created: ${chalk.bold(filePath)}`);
}

Handlebars.registerHelper('parameterType', utils.solTypeToTsType.bind(utils, ParamKind.Input, args.backend));
Handlebars.registerHelper('returnType', utils.solTypeToTsType.bind(utils, ParamKind.Output, args.backend));
if (args.partials) {
    registerPartials(args.partials);
}
const mainTemplate = utils.getNamedContent(args.template);
const template = Handlebars.compile<ContextData>(mainTemplate.content);
const abiFileNames = globSync(args.abis);

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
    if (_.isArray(parsedContent)) {
        ABI = parsedContent; // ABI file
    } else if (!_.isUndefined(parsedContent.abi)) {
        ABI = parsedContent.abi; // Truffle artifact
    } else if (!_.isUndefined(parsedContent.compilerOutput.abi)) {
        ABI = parsedContent.compilerOutput.abi; // 0x artifact
    }
    if (_.isUndefined(ABI)) {
        logUtils.log(`${chalk.red(`ABI not found in ${abiFileName}.`)}`);
        logUtils.log(
            `Please make sure your ABI file is either an array with ABI entries or a truffle artifact or 0x sol-compiler artifact`,
        );
        process.exit(1);
    }

    let ctor = ABI.find((abi: AbiDefinition) => abi.type === ABI_TYPE_CONSTRUCTOR) as ConstructorAbi;
    if (_.isUndefined(ctor)) {
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
        // This will make templates simpler
        const methodData = {
            ...methodAbi,
            singleReturnValue: methodAbi.outputs.length === 1,
            hasReturnValue: methodAbi.outputs.length !== 0,
            tsName: sanitizedMethodAbis[methodAbiIndex].name,
            functionSignature: abiUtils.getFunctionSignature(methodAbi),
        };
        return methodData;
    });

    const eventAbis = ABI.filter((abi: AbiDefinition) => abi.type === ABI_TYPE_EVENT) as EventAbi[];

    const contextData = {
        contractName: namedContent.name,
        ctor,
        methods: methodsData,
        events: eventAbis,
    };
    const renderedTsCode = template(contextData);
    writeOutputFile(namedContent.name, renderedTsCode);
}
