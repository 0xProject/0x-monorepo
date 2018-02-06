#!/usr/bin/env node

import chalk from 'chalk';
import * as fs from 'fs';
import { sync as globSync } from 'glob';
import * as Handlebars from 'handlebars';
import * as _ from 'lodash';
import * as mkdirp from 'mkdirp';
import * as yargs from 'yargs';

import toSnakeCase = require('to-snake-case');
import * as Web3 from 'web3';

import { ContextData, ParamKind } from './types';
import { utils } from './utils';

const ABI_TYPE_CONSTRUCTOR = 'constructor';
const ABI_TYPE_METHOD = 'function';
const ABI_TYPE_EVENT = 'event';
const DEFAULT_NETWORK_ID = 50;

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
    .option('network-id', {
        describe: 'ID of the network where contract ABIs are nested in artifacts',
        type: 'number',
        default: DEFAULT_NETWORK_ID,
    })
    .example(
        "$0 --abis 'src/artifacts/**/*.json' --out 'src/contracts/generated/' --partials 'src/templates/partials/**/*.handlebars' --template 'src/templates/contract.handlebars'",
        'Full usage example',
    ).argv;

function registerPartials(partialsGlob: string) {
    const partialTemplateFileNames = globSync(partialsGlob);
    utils.log(`Found ${chalk.green(`${partialTemplateFileNames.length}`)} ${chalk.bold('partial')} templates`);
    for (const partialTemplateFileName of partialTemplateFileNames) {
        const namedContent = utils.getNamedContent(partialTemplateFileName);
        Handlebars.registerPartial(namedContent.name, namedContent.content);
    }
    return partialsGlob;
}

function writeOutputFile(name: string, renderedTsCode: string): void {
    const fileName = toSnakeCase(name);
    const filePath = `${args.output}/${fileName}.ts`;
    fs.writeFileSync(filePath, renderedTsCode);
    utils.log(`Created: ${chalk.bold(filePath)}`);
}

Handlebars.registerHelper('parameterType', utils.solTypeToTsType.bind(utils, ParamKind.Input));
Handlebars.registerHelper('returnType', utils.solTypeToTsType.bind(utils, ParamKind.Output));

if (args.partials) {
    registerPartials(args.partials);
}
const mainTemplate = utils.getNamedContent(args.template);
const template = Handlebars.compile<ContextData>(mainTemplate.content);
const abiFileNames = globSync(args.abis);

if (_.isEmpty(abiFileNames)) {
    utils.log(`${chalk.red(`No ABI files found.`)}`);
    utils.log(`Please make sure you've passed the correct folder name and that the files have
               ${chalk.bold('*.json')} extensions`);
    process.exit(1);
} else {
    utils.log(`Found ${chalk.green(`${abiFileNames.length}`)} ${chalk.bold('ABI')} files`);
    mkdirp.sync(args.output);
}
for (const abiFileName of abiFileNames) {
    const namedContent = utils.getNamedContent(abiFileName);
    utils.log(`Processing: ${chalk.bold(namedContent.name)}...`);
    const parsedContent = JSON.parse(namedContent.content);
    let ABI;
    if (_.isArray(parsedContent)) {
        ABI = parsedContent; // ABI file
    } else if (!_.isUndefined(parsedContent.abi)) {
        ABI = parsedContent.abi; // Truffle artifact
    } else if (!_.isUndefined(parsedContent.networks) && !_.isUndefined(parsedContent.networks[args.networkId])) {
        ABI = parsedContent.networks[args.networkId].abi; // 0x contracts package artifact
    }
    if (_.isUndefined(ABI)) {
        utils.log(`${chalk.red(`ABI not found in ${abiFileName}.`)}`);
        utils.log(`Please make sure your ABI file is either an array with ABI entries or an object with the abi key`);
        process.exit(1);
    }

    let ctor = ABI.find((abi: Web3.AbiDefinition) => abi.type === ABI_TYPE_CONSTRUCTOR) as Web3.ConstructorAbi;
    if (_.isUndefined(ctor)) {
        ctor = utils.getEmptyConstructor(); // The constructor exists, but it's implicit in JSON's ABI definition
    }

    const methodAbis = ABI.filter((abi: Web3.AbiDefinition) => abi.type === ABI_TYPE_METHOD) as Web3.MethodAbi[];
    const methodsData = _.map(methodAbis, methodAbi => {
        _.map(methodAbi.inputs, input => {
            if (_.isEmpty(input.name)) {
                // Auto-generated getters don't have parameter names
                input.name = 'index';
            }
        });
        // This will make templates simpler
        const methodData = {
            ...methodAbi,
            singleReturnValue: methodAbi.outputs.length === 1,
        };
        return methodData;
    });

    const eventAbis = ABI.filter((abi: Web3.AbiDefinition) => abi.type === ABI_TYPE_EVENT) as Web3.EventAbi[];

    const contextData = {
        contractName: namedContent.name,
        ctor,
        methods: methodsData,
        events: eventAbis,
    };
    const renderedTsCode = template(contextData);
    writeOutputFile(namedContent.name, renderedTsCode);
}
