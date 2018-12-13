import * as _ from 'lodash';
import { ImportContents, StandardOutput } from 'solc';
import * as S from 'solidity-parser-antlr';

import { Compiler as Solc } from '@0x/sol-compiler';

import { SourceCollection } from './source_reader';
import { unparse } from './unparser';
import * as utils from './utils';

export const compile = async (sources: SourceCollection, ast: S.SourceUnit) => {
    // Extract required version from pragma of ast
    const version =
        _.map(utils.pragmaNodes(ast).filter(({ name }) => name === 'solidity'), ({ value }) => value)[0] || 'latest';

    // Get Solidity compiler
    const compiler = await Solc.getSolcAsync(version);

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

    // Run the compiler
    const result: StandardOutput = JSON.parse(
        compiler.compileStandardWrapper(JSON.stringify(input), findImportsCallback),
    );

    // Throw errors
    const errors = result.errors.filter(({ severity }) => severity === 'error');
    if (errors.length > 0) {
        throw new Error(_.map(errors, ({ formattedMessage }) => formattedMessage).join('\n'));
    }
};
