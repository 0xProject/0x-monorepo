import { AbiDefinition, ContractAbi, DataItem, EventAbi, MethodAbi } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import * as process from 'process';

const keccak256 = ethUtil.sha3;
const ARGS = process.argv.slice(2);
const INDENT = '    ';
const LINEBREAK = '\n';
const VISIBILITY = 'internal';

interface ParsedContract {
    methods: {
        [functionName: string]: Array<{
            selector: string;
            signature: string;
        }>;
    };
    events: {
        [eventName: string]: {
            selector: string;
            signature: string;
        };
    };
}

// tslint:disable: no-console
(() => {
    const [exchangeArtifactsFile, outputFile] = ARGS;
    const exchangeArtifacts = require(exchangeArtifactsFile);
    const contractName = path.basename(outputFile, '.sol');
    const parsedContract = parseContract(exchangeArtifacts.compilerOutput.abi);
    const contractDefinition = defineContract(contractName, parsedContract);
    const preamble = extractOutputFilePreamble(outputFile);
    const outputFileContents = `${preamble}${contractDefinition}${LINEBREAK}`;
    fs.writeFileSync(outputFile, outputFileContents);
    console.log(`Wrote exchange selectors to "${path.resolve(outputFile)}."`);
})();

function parseContract(abi: ContractAbi): ParsedContract {
    const parsedContract: ParsedContract = {
        methods: {},
        events: {},
    };
    for (const abiItem of abi) {
        if (isMethodAbi(abiItem)) {
            const name = abiItem.name;
            const signature = `${name}(${encodeMethodInputs(abiItem.inputs)})`;
            const selector = `0x${keccak256(signature)
                .slice(0, 4)
                .toString('hex')}`;
            if (parsedContract.methods[name] === undefined) {
                parsedContract.methods[name] = [];
            }
            parsedContract.methods[name].push({
                selector,
                signature,
            });
        } else if (isEventAbi(abiItem)) {
            const name = abiItem.name;
            const signature = `${name}(${encodeMethodInputs(abiItem.inputs)})`;
            const selector = `0x${keccak256(signature).toString('hex')}`;
            parsedContract.events[name] = {
                selector,
                signature,
            };
        }
    }
    return parsedContract;
}

function isMethodAbi(abiItem: AbiDefinition): abiItem is MethodAbi {
    return abiItem.type === 'function';
}

function isEventAbi(abiItem: AbiDefinition): abiItem is EventAbi {
    return abiItem.type === 'event';
}

function defineContract(contractName: string, parsedContract: ParsedContract): string {
    const constantDefinitions = [];
    // Define function selectors.
    const sortedMethodNames = _.sortBy(_.keys(parsedContract.methods), name => name.toLowerCase());
    for (const name of sortedMethodNames) {
        const methods = parsedContract.methods[name];
        for (let idx = 0; idx < methods.length; idx++) {
            const constantLines = generateFunctionSelectorConstantDefinition(
                name,
                methods[idx].signature,
                methods[idx].selector,
                idx,
                methods.length,
            );
            constantDefinitions.push(constantLines);
        }
    }
    // Define event selectors.
    const sortedEventNames = _.sortBy(_.keys(parsedContract.events), name => name.toLowerCase());
    for (const name of sortedEventNames) {
        const event = parsedContract.events[name];
        const constantLines = generateEventSelectorConstantDefinition(name, event.signature, event.selector);
        constantDefinitions.push(constantLines);
    }
    return [
        `contract ${contractName} {`,
        `${INDENT}// solhint-disable max-line-length`,
        '',
        constantDefinitions
            .map(lines => lines.map(line => `${INDENT}${line}`))
            .map(lines => lines.join(LINEBREAK))
            .join(`${LINEBREAK}${LINEBREAK}`),
        `}`,
    ].join(LINEBREAK);
}

function extractOutputFilePreamble(outputFile: string): string {
    const preambleLines = [];
    const outputFileLines = fs.readFileSync(outputFile, 'utf-8').split(/\r?\n/);
    for (const line of outputFileLines) {
        if (/^\s*contract\s+[a-zA-Z][a-zA-Z0-9_]+/.test(line)) {
            preambleLines.push('');
            break;
        }
        preambleLines.push(line);
    }
    return preambleLines.join(LINEBREAK);
}

function generateFunctionSelectorConstantDefinition(
    name: string,
    signature: string,
    selector: string,
    idx: number,
    total: number,
): string[] {
    const varName = _.snakeCase(total === 1 ? name : `${name}_${idx + 1}`).toUpperCase();
    return [`// function ${signature}`, `bytes4 constant ${VISIBILITY} ${varName}_SELECTOR = ${selector};`];
}

function generateEventSelectorConstantDefinition(name: string, signature: string, selector: string): string[] {
    const varName = _.snakeCase(name).toUpperCase();
    return [`// event ${signature}`, `bytes32 constant ${VISIBILITY} EVENT_${varName}_SELECTOR = ${selector};`];
}

function encodeMethodInputs(inputs?: DataItem[]): string {
    if (inputs === undefined) {
        throw new Error('encodeMethodInputs: inputs are undefined');
    }
    const types = [];
    for (const input of inputs) {
        if (input.type === 'tuple') {
            types.push(`(${encodeMethodInputs(input.components)})`);
        } else if (input.type === 'tuple[]') {
            types.push(`(${encodeMethodInputs(input.components)})[]`);
        } else {
            types.push(input.type);
        }
    }
    return types.join(',');
}
