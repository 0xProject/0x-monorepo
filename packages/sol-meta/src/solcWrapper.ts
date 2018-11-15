import * as S from 'solidity-parser-antlr';
import { ImportContents, StandardOutput } from 'solc';

import { Compiler as Solc } from '@0x/sol-compiler';

import { SourceCollection } from './source_reader';
import { unparse } from './unparser';
import * as utils from './utils';

export const compile = async (sources: SourceCollection, ast: S.SourceUnit) => {
    // Extract required version from pragma of ast
    const version =
        utils
            .pragmaNodes(ast)
            .filter(({ name }) => name === 'solidity')
            .map(({ value }) => value)[0] || 'latest';

    // Get Solidity compiler
    console.time('Loading solc-js');
    const compiler = await Solc.getSolcAsync(version);
    console.timeEnd('Loading solc-js');

    // Solidity standard JSON input
    // TODO: Typescript typings
    // See: https://solidity.readthedocs.io/en/develop/using-the-compiler.html#compiler-input-and-output-json-description
    const input = {
        language: 'Solidity',
        sources: {
            ...utils.objectMap(sources, ({ source: content }) => ({ content })),
            TARGET_: { content: unparse(ast) },
        },
        settings: {
            remappings: {
                // TODO
            },
        },
        outputSelection: {
            TARGET_: {
                '*': [],
            },
        },
    };

    // All imports should be accounted for in sources, throw an error in the callback
    const findImportsCallback = (importPath: string): ImportContents => {
        throw new Error(`Could not find ${importPath}.`);
    };

    console.time('Compiling');
    const result: StandardOutput = JSON.parse(
        compiler.compileStandardWrapper(JSON.stringify(input), findImportsCallback),
    );
    console.timeEnd('Compiling');

    // Throw errors
    const errors = result.errors.filter(({ severity }) => severity === 'error');
    if (errors.length > 0) {
        throw new Error(errors.map(({ formattedMessage }) => formattedMessage).join('\n'));
    }
};
