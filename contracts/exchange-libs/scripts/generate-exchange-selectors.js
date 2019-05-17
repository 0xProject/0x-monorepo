'use strict'

const ethUtil = require('ethereumjs-util');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const process = require('process');

const keccak256 = ethUtil.keccak256 || ethUtil.sha3;
const ARGS = process.argv.slice(2);
const INDENT = '    ';
const LINEBREAK = '\n';
const VISIBILITY = 'internal';

(function () {
    const [ exchangeArtifactsFile, outputFile ] = ARGS;
    const exchangeArtifacts = require(exchangeArtifactsFile);
    const contractName = path.basename(outputFile, '.sol');
    const functionsByName = extractFunctions(
        exchangeArtifacts.compilerOutput.abi,
    );
    const contractDefinition = defineContract(contractName, functionsByName);
    const preamble = extractOutputFilePreamble(outputFile);
    const outputFileContents = `${preamble}${contractDefinition}${LINEBREAK}`;
    fs.writeFileSync(outputFile, outputFileContents);
    console.log(`Wrote exchange selectors to "${path.resolve(outputFile)}."`);
})();

function extractFunctions(abi) {
    const selectorsByName = {};
    for (const method of abi) {
        if (method.type !== 'function') {
            continue;
        }
        const name = method.name;
        const signature = `${name}(${encodeMethodInputs(method.inputs)})`;
        const selector = `0x${keccak256(signature).slice(0, 4).toString('hex')}`;
        if (!selectorsByName[name]) {
            selectorsByName[name] = [];
        }
        selectorsByName[name].push({
            selector,
            signature,
        });
    }
    return selectorsByName;
}

function defineContract(contractName, functionsByName) {
    const constantDefinitions = [];
    const sortedFunctionNames = _.sortBy(_.keys(functionsByName), name => name.toLowerCase());
    for (const name of sortedFunctionNames) {
        const fns = functionsByName[name];
        for (let idx = 0; idx < fns.length; idx++) {
            const constantLines = generateSelectorConstantDefinition(
                name,
                fns[idx],
                idx,
                fns.length,
            );
            constantDefinitions.push(constantLines);
        }
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

function extractOutputFilePreamble(outputFile) {
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

function generateSelectorConstantDefinition(name, selector, idx, total) {
    const varName =
        _.snakeCase(total == 1 ? name : `${name}_${idx+1}`).toUpperCase();
    return [
        `// ${selector.signature}`,
        `bytes4 constant ${VISIBILITY} ${varName}_SELECTOR = ${selector.selector};`,
    ];
}

function encodeMethodInputs(inputs) {
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
