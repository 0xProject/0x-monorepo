import { createHash } from 'crypto';

import * as changeCase from 'change-case';
import * as cliFormat from 'cli-format';
import { AbiType, ConstructorAbi, DataItem, TupleDataItem } from 'ethereum-types';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import toSnakeCase = require('to-snake-case');

import { ContractsBackend, ParamKind } from './types';

export const utils = {
    solTypeToAssertion(solName: string, solType: string): string {
        const trailingArrayRegex = /\[\d*\]$/;
        if (solType.match(trailingArrayRegex)) {
            const assertion = `assert.isArray('${solName}', ${solName});`;
            return assertion;
        } else {
            const solTypeRegexToTsType = [
                {
                    regex: '^u?int(8|16|32)?$',
                    assertion: `assert.isNumberOrBigNumber('${solName}', ${solName});`,
                },
                { regex: '^string$', assertion: `assert.isString('${solName}', ${solName});` },
                { regex: '^address$', assertion: `assert.isString('${solName}', ${solName});` },
                { regex: '^bool$', assertion: `assert.isBoolean('${solName}', ${solName});` },
                { regex: '^u?int\\d*$', assertion: `assert.isBigNumber('${solName}', ${solName});` },
                { regex: '^bytes\\d*$', assertion: `assert.isString('${solName}', ${solName});` },
            ];
            for (const regexAndTxType of solTypeRegexToTsType) {
                const { regex, assertion } = regexAndTxType;
                if (solType.match(regex)) {
                    return assertion;
                }
            }
            const TUPLE_TYPE_REGEX = '^tuple$';
            if (solType.match(TUPLE_TYPE_REGEX)) {
                // NOTE(fabio): Omit assertions for complex types since this would require taking a type
                // definition and generating an instance of that type programmatically and checking it
                // against a list of know json-schemas in order to discover the correct schema assertion
                // to use. This approach is brittle and error-prone.
                const assertion = '';
                return assertion;
            }
            throw new Error(`Unknown Solidity type found: ${solType}`);
        }
    },
    solTypeToTsType(paramKind: ParamKind, backend: ContractsBackend, solType: string, components?: DataItem[]): string {
        const trailingArrayRegex = /\[\d*\]$/;
        if (solType.match(trailingArrayRegex)) {
            const arrayItemSolType = solType.replace(trailingArrayRegex, '');
            const arrayItemTsType = utils.solTypeToTsType(paramKind, backend, arrayItemSolType, components);
            const arrayTsType =
                utils.isUnionType(arrayItemTsType) || utils.isObjectType(arrayItemTsType)
                    ? `Array<${arrayItemTsType}>`
                    : `${arrayItemTsType}[]`;
            return arrayTsType;
        } else {
            const solTypeRegexToTsType = [
                { regex: '^string$', tsType: 'string' },
                { regex: '^address$', tsType: 'string' },
                { regex: '^bool$', tsType: 'boolean' },
                { regex: '^u?int\\d*$', tsType: 'BigNumber' },
                { regex: '^bytes\\d*$', tsType: 'string' },
            ];
            if (paramKind === ParamKind.Input) {
                // web3 and ethers allow to pass those as numbers instead of bignumbers
                solTypeRegexToTsType.unshift({
                    regex: '^u?int(8|16|32)?$',
                    tsType: 'number|BigNumber',
                });
            }
            if (backend === ContractsBackend.Ethers && paramKind === ParamKind.Output) {
                // ethers-contracts automatically converts small BigNumbers to numbers
                solTypeRegexToTsType.unshift({
                    regex: '^u?int(8|16|32|48)?$',
                    tsType: 'number',
                });
            }
            for (const regexAndTxType of solTypeRegexToTsType) {
                const { regex, tsType } = regexAndTxType;
                if (solType.match(regex)) {
                    return tsType;
                }
            }
            const TUPLE_TYPE_REGEX = '^tuple$';
            if (solType.match(TUPLE_TYPE_REGEX)) {
                const componentsType = _.map(components, component => {
                    const componentValueType = utils.solTypeToTsType(
                        paramKind,
                        backend,
                        component.type,
                        component.components,
                    );
                    const componentType = `${component.name}: ${componentValueType}`;
                    return componentType;
                });
                const tsType = `{${componentsType.join(';')}}`;
                return tsType;
            }
            throw new Error(`Unknown Solidity type found: ${solType}`);
        }
    },
    solTypeToPyType(dataItem: DataItem): string {
        const solType = dataItem.type;
        const components = dataItem.components;
        const trailingArrayRegex = /\[\d*\]$/;
        if (solType.match(trailingArrayRegex)) {
            const arrayItemPyType = utils.solTypeToPyType({
                ...dataItem,
                type: dataItem.type.replace(trailingArrayRegex, ''),
            });
            const arrayPyType = `List[${arrayItemPyType}]`;
            return arrayPyType;
        } else {
            const solTypeRegexToPyType = [
                { regex: '^string$', pyType: 'str' },
                { regex: '^address$', pyType: 'str' },
                { regex: '^bool$', pyType: 'bool' },
                { regex: '^u?int\\d*$', pyType: 'int' },
                { regex: '^bytes\\d*$', pyType: 'Union[bytes, str]' },
            ];
            for (const regexAndTxType of solTypeRegexToPyType) {
                const { regex, pyType } = regexAndTxType;
                if (solType.match(regex)) {
                    return pyType;
                }
            }
            const TUPLE_TYPE_REGEX = '^tuple$';
            if (solType.match(TUPLE_TYPE_REGEX)) {
                return utils.makePythonTupleName(dataItem);
            }
            throw new Error(`Unknown Solidity type found: ${solType}`);
        }
    },
    isUnionType(tsType: string): boolean {
        return tsType === 'number|BigNumber';
    },
    isObjectType(tsType: string): boolean {
        return /^{.*}$/.test(tsType);
    },
    getPartialNameFromFileName(filename: string): string {
        const name = path.parse(filename).name;
        return name;
    },
    getNamedContent(filename: string): { name: string; content: string } {
        const name = utils.getPartialNameFromFileName(filename);
        try {
            const content = fs.readFileSync(filename).toString();
            return {
                name,
                content,
            };
        } catch (err) {
            throw new Error(`Failed to read ${filename}: ${err}`);
        }
    },
    getEmptyConstructor(): ConstructorAbi {
        return {
            type: AbiType.Constructor,
            stateMutability: 'nonpayable',
            payable: false,
            inputs: [],
        };
    },
    makeOutputFileName(name: string): string {
        let fileName = toSnakeCase(name);
        // HACK: Snake case doesn't make a lot of sense for abbreviated names but we can't reliably detect abbreviations
        // so we special-case the abbreviations we use.
        fileName = fileName.replace('z_r_x', 'zrx').replace('e_r_c', 'erc');
        return fileName;
    },
    writeOutputFile(filePath: string, renderedTsCode: string): void {
        fs.writeFileSync(filePath, renderedTsCode);
    },
    isOutputFileUpToDate(outputFile: string, sourceFiles: string[]): boolean {
        const sourceFileModTimeMs = sourceFiles.map(file => fs.statSync(file).mtimeMs);
        try {
            const outFileModTimeMs = fs.statSync(outputFile).mtimeMs;
            return sourceFileModTimeMs.find(sourceMs => sourceMs > outFileModTimeMs) === undefined;
        } catch (err) {
            if (err.code === 'ENOENT') {
                return false;
            } else {
                throw err;
            }
        }
    },
    /**
     * simply concatenate all of the names of the components, and convert that
     * concatenation into PascalCase to conform to Python convention.
     */
    makePythonTupleName(tuple: DataItem): string {
        const tupleComponents = tuple.components;
        const lengthOfHashSuffix = 8;
        return `Tuple0x${createHash('MD5')
            .update(_.map(tupleComponents, component => component.name).join('_'))
            .digest()
            .toString('hex')
            .substring(0, lengthOfHashSuffix)}`;
    },
    /**
     * @returns a string that is a Python code snippet that's intended to be
     * used as the second parameter to a TypedDict() instantiation; value
     * looks like "{ 'python_dict_key': python_type, ... }".
     */
    makePythonTupleClassBody(tupleComponents: DataItem[]): string {
        let toReturn: string = '';
        for (const tupleComponent of tupleComponents) {
            toReturn = `${toReturn}\n\n    ${tupleComponent.name}: ${utils.solTypeToPyType(tupleComponent)}`;
        }
        toReturn = `${toReturn}`;
        return toReturn;
    },
    /**
     * used to generate Python-parseable identifier names for parameters to
     * contract methods.
     */
    toPythonIdentifier(input: string): string {
        let snakeCased = changeCase.snake(input);
        const pythonReservedWords = [
            'False',
            'None',
            'True',
            'and',
            'as',
            'assert',
            'break',
            'class',
            'continue',
            'def',
            'del',
            'elif',
            'else',
            'except',
            'finally',
            'for',
            'from',
            'global',
            'if',
            'import',
            'in',
            'is',
            'lambda',
            'nonlocal',
            'not',
            'or',
            'pass',
            'raise',
            'return',
            'try',
            'while',
            'with',
            'yield',
        ];
        const pythonBuiltins = [
            'abs',
            'delattr',
            'hash',
            'memoryview',
            'set',
            'all',
            'dict',
            'help',
            'min',
            'setattr',
            'any',
            'dir',
            'hex',
            'next',
            'slice',
            'ascii',
            'divmod',
            'id',
            'object',
            'sorted',
            'bin',
            'enumerate',
            'input',
            'oct',
            'staticmethod',
            'bool',
            'eval',
            'int',
            'open',
            'str',
            'breakpoint',
            'exec',
            'isinstance',
            'ord',
            'sum',
            'bytearray',
            'filter',
            'issubclass',
            'pow',
            'super',
            'bytes',
            'float',
            'iter',
            'print',
            'tuple',
            'callable',
            'format',
            'len',
            'property',
            'type',
            'chr',
            'frozenset',
            'list',
            'range',
            'vars',
            'classmethod',
            'getattr',
            'locals',
            'repr',
            'zip',
            'compile',
            'globals',
            'map',
            'reversed',
            '__import__',
            'complex',
            'hasattr',
            'max',
            'round',
        ];
        if (
            pythonReservedWords.includes(snakeCased) ||
            pythonBuiltins.includes(snakeCased) ||
            /*changeCase strips leading underscores :(*/ input[0] === '_'
        ) {
            snakeCased = `_${snakeCased}`;
        }
        return snakeCased;
    },
    /**
     * Python docstrings are used to generate documentation, and that
     * transformation supports annotation of parameters, return types, etc, via
     * re-Structured Text "interpreted text roles".  Per the pydocstyle linter,
     * such annotations should be line-wrapped at 80 columns, with a hanging
     * indent of 4 columns.  This function simply returns an accordingly
     * wrapped and hanging-indented `role` string.
     */
    wrapPythonDocstringRole(docstring: string, indent: number): string {
        const columnsPerIndent = 4;
        const columnsPerRow = 80;
        return cliFormat.wrap(docstring, {
            paddingLeft: ' '.repeat(indent),
            width: columnsPerRow,
            ansi: false,
            hangingIndent: ' '.repeat(columnsPerIndent),
        });
    },
    extractTuples(
        parameter: DataItem,
        tupleBodies: { [pythonTupleName: string]: string }, // output
        tupleDependencies: Array<[string, string]>, // output
    ): void {
        if (parameter.type === 'tuple' || parameter.type === 'tuple[]') {
            const tupleDataItem = parameter as TupleDataItem; // tslint:disable-line:no-unnecessary-type-assertion
            // without the above cast (which tslint complains about), tsc says
            //     Argument of type 'DataItem[] | undefined' is not assignable to parameter of type 'DataItem[]'.
            //     Type 'undefined' is not assignable to type 'DataItem[]'
            // when the code below tries to access tupleDataItem.components.
            const pythonTupleName = utils.makePythonTupleName(tupleDataItem);
            tupleBodies[pythonTupleName] = utils.makePythonTupleClassBody(tupleDataItem.components);
            for (const component of tupleDataItem.components) {
                if (component.type === 'tuple' || component.type === 'tuple[]') {
                    tupleDependencies.push([
                        utils.makePythonTupleName(component as TupleDataItem), // tslint:disable-line:no-unnecessary-type-assertion
                        pythonTupleName,
                    ]);
                    utils.extractTuples(component, tupleBodies, tupleDependencies);
                }
            }
        }
    },
};
