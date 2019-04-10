import { AbiDefinition, AbiType, ContractAbi, DataItem, MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { BigNumber } from './configured_bignumber';

type ParamName = null | string | NestedParamName;
interface NestedParamName {
    name: string | null;
    names: ParamName[];
}

// Note(albrow): This function is unexported in ethers.js. Copying it here for
// now.
// Source: https://github.com/ethers-io/ethers.js/blob/884593ab76004a808bf8097e9753fb5f8dcc3067/contracts/interface.js#L30
function parseEthersParams(params: DataItem[]): { names: ParamName[]; types: string[] } {
    const names: ParamName[] = [];
    const types: string[] = [];

    params.forEach((param: DataItem) => {
        if (param.components != null) {
            let suffix = '';
            const arrayBracket = param.type.indexOf('[');
            if (arrayBracket >= 0) {
                suffix = param.type.substring(arrayBracket);
            }

            const result = parseEthersParams(param.components);
            names.push({ name: param.name || null, names: result.names });
            types.push(`tuple(${result.types.join(',')})${suffix}`);
        } else {
            names.push(param.name || null);
            types.push(param.type);
        }
    });

    return {
        names,
        types,
    };
}

// returns true if x is equal to y and false otherwise. Performs some minimal
// type conversion and data massaging for x and y, depending on type. name and
// type should typically be derived from parseEthersParams.
function isAbiDataEqual(name: ParamName, type: string, x: any, y: any): boolean {
    if (x === undefined && y === undefined) {
        return true;
    } else if (x === undefined && y !== undefined) {
        return false;
    } else if (x !== undefined && y === undefined) {
        return false;
    }
    if (_.endsWith(type, '[]')) {
        // For array types, we iterate through the elements and check each one
        // individually. Strangely, name does not need to be changed in this
        // case.
        if (x.length !== y.length) {
            return false;
        }
        const newType = _.trimEnd(type, '[]');
        for (let i = 0; i < x.length; i++) {
            if (!isAbiDataEqual(name, newType, x[i], y[i])) {
                return false;
            }
        }
        return true;
    }
    if (_.startsWith(type, 'tuple(')) {
        if (_.isString(name)) {
            throw new Error('Internal error: type was tuple but names was a string');
        } else if (name === null) {
            throw new Error('Internal error: type was tuple but names was null');
        }
        // For tuples, we iterate through the underlying values and check each
        // one individually.
        const types = splitTupleTypes(type);
        if (types.length !== name.names.length) {
            throw new Error(
                `Internal error: parameter types/names length mismatch (${types.length} != ${name.names.length})`,
            );
        }
        for (let i = 0; i < types.length; i++) {
            // For tuples, name is an object with a names property that is an
            // array. As an example, for orders, name looks like:
            //
            //  {
            //      name: 'orders',
            //      names: [
            //          'makerAddress',
            //          // ...
            //          'takerAssetData'
            //      ]
            //  }
            //
            const nestedName = _.isString(name.names[i])
                ? (name.names[i] as string)
                : ((name.names[i] as NestedParamName).name as string);
            if (!isAbiDataEqual(name.names[i], types[i], x[nestedName], y[nestedName])) {
                return false;
            }
        }
        return true;
    } else if (type === 'address' || type === 'bytes') {
        // HACK(albrow): ethers.js returns the checksummed address even when
        // initially passed in a non-checksummed address. To account for that,
        // we convert to lowercase before comparing.
        return _.isEqual(_.toLower(x), _.toLower(y));
    } else if (_.startsWith(type, 'uint') || _.startsWith(type, 'int')) {
        return new BigNumber(x).eq(new BigNumber(y));
    }
    return _.isEqual(x, y);
}

// splitTupleTypes splits a tuple type string (of the form `tuple(X)` where X is
// any other type or list of types) into its component types. It works with
// nested tuples, so, e.g., `tuple(tuple(uint256,address),bytes32)` will yield:
// `['tuple(uint256,address)', 'bytes32']`. It expects exactly one tuple type as
// an argument (not an array).
function splitTupleTypes(type: string): string[] {
    if (_.endsWith(type, '[]')) {
        throw new Error('Internal error: array types are not supported');
    } else if (!_.startsWith(type, 'tuple(')) {
        throw new Error(`Internal error: expected tuple type but got non-tuple type: ${type}`);
    }
    // Trim the outtermost tuple().
    const trimmedType = type.substring('tuple('.length, type.length - 1);
    const types: string[] = [];
    let currToken = '';
    let parenCount = 0;
    // Tokenize the type string while keeping track of parentheses.
    for (const char of trimmedType) {
        switch (char) {
            case '(':
                parenCount += 1;
                currToken += char;
                break;
            case ')':
                parenCount -= 1;
                currToken += char;
                break;
            case ',':
                if (parenCount === 0) {
                    types.push(currToken);
                    currToken = '';
                    break;
                } else {
                    currToken += char;
                    break;
                }
            default:
                currToken += char;
                break;
        }
    }
    types.push(currToken);
    return types;
}

export const abiUtils = {
    parseEthersParams,
    isAbiDataEqual,
    splitTupleTypes,
    parseFunctionParam(param: DataItem): string {
        if (param.type === 'tuple') {
            // Parse out tuple types into {type_1, type_2, ..., type_N}
            const tupleComponents = param.components;
            const paramString = _.map(tupleComponents, component => abiUtils.parseFunctionParam(component));
            const tupleParamString = `{${paramString}}`;
            return tupleParamString;
        }
        return param.type;
    },
    getFunctionSignature(methodAbi: MethodAbi): string {
        const functionName = methodAbi.name;
        const parameterTypeList = _.map(methodAbi.inputs, (param: DataItem) => abiUtils.parseFunctionParam(param));
        const functionSignature = `${functionName}(${parameterTypeList})`;
        return functionSignature;
    },
    /**
     * Solidity supports function overloading whereas TypeScript does not.
     * See: https://solidity.readthedocs.io/en/v0.4.21/contracts.html?highlight=overload#function-overloading
     * In order to support overloaded functions, we suffix overloaded function names with an index.
     * This index should be deterministic, regardless of function ordering within the smart contract. To do so,
     * we assign indexes based on the alphabetical order of function signatures.
     *
     * E.g
     * ['f(uint)', 'f(uint,byte32)']
     * Should always be renamed to:
     * ['f1(uint)', 'f2(uint,byte32)']
     * Regardless of the order in which these these overloaded functions are declared within the contract ABI.
     */
    renameOverloadedMethods(inputContractAbi: ContractAbi): ContractAbi {
        const contractAbi = _.cloneDeep(inputContractAbi);
        const methodAbis = contractAbi.filter((abi: AbiDefinition) => abi.type === AbiType.Function) as MethodAbi[];
        // Sort method Abis into alphabetical order, by function signature
        const methodAbisOrdered = _.sortBy(methodAbis, [
            (methodAbi: MethodAbi) => {
                const functionSignature = abiUtils.getFunctionSignature(methodAbi);
                return functionSignature;
            },
        ]);
        // Group method Abis by name (overloaded methods will be grouped together, in alphabetical order)
        const methodAbisByName: { [key: string]: MethodAbi[] } = {};
        _.each(methodAbisOrdered, methodAbi => {
            (methodAbisByName[methodAbi.name] || (methodAbisByName[methodAbi.name] = [])).push(methodAbi);
        });
        // Rename overloaded methods to overloadedMethodName1, overloadedMethodName2, ...
        _.each(methodAbisByName, methodAbisWithSameName => {
            _.each(methodAbisWithSameName, (methodAbi, i: number) => {
                if (methodAbisWithSameName.length > 1) {
                    const overloadedMethodId = i + 1;
                    const sanitizedMethodName = `${methodAbi.name}${overloadedMethodId}`;
                    const indexOfExistingAbiWithSanitizedMethodNameIfExists = _.findIndex(
                        methodAbis,
                        currentMethodAbi => currentMethodAbi.name === sanitizedMethodName,
                    );
                    if (indexOfExistingAbiWithSanitizedMethodNameIfExists >= 0) {
                        const methodName = methodAbi.name;
                        throw new Error(
                            `Failed to rename overloaded method '${methodName}' to '${sanitizedMethodName}'. A method with this name already exists.`,
                        );
                    }
                    methodAbi.name = sanitizedMethodName;
                }
            });
        });
        return contractAbi;
    },
};
