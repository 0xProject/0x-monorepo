import * as _ from 'lodash';

import {
    ConstructorAbi,
    DataItem,
    DevdocOutput,
    EventAbi,
    FallbackAbi,
    MethodAbi,
    StandardContractOutput,
} from 'ethereum-types';

import { Compiler, CompilerOptions } from '@0xproject/sol-compiler';
import {
    DocAgnosticFormat,
    DocSection,
    Event,
    EventArg,
    Parameter,
    SolidityMethod,
    Type,
    TypeDocTypes,
} from '@0xproject/types';

/**
 * Invoke the Solidity compiler and transform its ABI and devdoc outputs into
 * the types that are used as input to documentation generation tools.
 * @param contractsToCompile list of contracts for which to generate doc objects
 * @param contractsDir the directory in which to find the `contractsToCompile` as well as their dependencies.
 * @return doc object for use with documentation generation tools.
 */
export async function generateSolDocAsync(
    contractsToCompile: string[],
    contractsDir: string,
): Promise<DocAgnosticFormat> {
    const doc: DocAgnosticFormat = {};

    const compilerOptions = _makeCompilerOptions(contractsToCompile, contractsDir);
    const compiler = new Compiler(compilerOptions);
    const compilerOutputs = await compiler.getCompilerOutputsAsync();
    for (const compilerOutput of compilerOutputs) {
        const contractFileNames = _.keys(compilerOutput.contracts);
        for (const contractFileName of contractFileNames) {
            const contractNameToOutput = compilerOutput.contracts[contractFileName];

            const contractNames = _.keys(contractNameToOutput);
            for (const contractName of contractNames) {
                const compiledContract = contractNameToOutput[contractName];
                if (_.isUndefined(compiledContract.abi)) {
                    throw new Error('compiled contract did not contain ABI output');
                }
                doc[contractName] = _genDocSection(compiledContract);
            }
        }
    }

    return doc;
}

function _makeCompilerOptions(contractsToCompile: string[], contractsDir: string): CompilerOptions {
    const compilerOptions: CompilerOptions = {
        contractsDir,
        contracts: '*',
        compilerSettings: {
            outputSelection: {
                ['*']: {
                    ['*']: ['abi', 'devdoc'],
                },
            },
        },
    };

    const shouldOverrideCatchAllContractsConfig = !_.isUndefined(contractsToCompile);
    if (shouldOverrideCatchAllContractsConfig) {
        compilerOptions.contracts = contractsToCompile;
    }

    return compilerOptions;
}

function _genDocSection(compiledContract: StandardContractOutput): DocSection {
    const docSection: DocSection = {
        comment: _.isUndefined(compiledContract.devdoc) ? '' : compiledContract.devdoc.title,
        constructors: [],
        methods: [],
        properties: [],
        types: [],
        functions: [],
        events: [],
    };

    for (const abiDefinition of compiledContract.abi) {
        switch (abiDefinition.type) {
            case 'constructor':
                docSection.constructors.push(_genConstructorDoc(abiDefinition, compiledContract.devdoc));
                break;
            case 'event':
                (docSection.events as Event[]).push(_genEventDoc(abiDefinition));
                // note that we're not sending devdoc to _genEventDoc().
                // that's because the type of the events array doesn't have any fields for documentation!
                break;
            case 'function':
                docSection.methods.push(_genMethodDoc(abiDefinition, compiledContract.devdoc));
                break;
            default:
                throw new Error(`unknown and unsupported AbiDefinition type '${abiDefinition.type}'`);
        }
    }

    return docSection;
}

function _genConstructorDoc(abiDefinition: ConstructorAbi, devdocIfExists: DevdocOutput | undefined): SolidityMethod {
    const { parameters, methodSignature } = _genMethodParamsDoc(
        '', // TODO: update depending on how constructors are keyed in devdoc
        abiDefinition.inputs,
        devdocIfExists,
    );

    const comment = _devdocMethodDetailsIfExist(methodSignature, devdocIfExists);
    // TODO: figure out why devdoc'd constructors don't get output by solc

    const constructorDoc: SolidityMethod = {
        isConstructor: true,
        name: '', // sad we have to specify this
        callPath: '', // TODO: wtf is this?
        parameters,
        returnType: { name: '', typeDocType: TypeDocTypes.Intrinsic }, // sad we have to specify this
        isConstant: false, // constructors are non-const by their nature, right?
        isPayable: abiDefinition.payable,
        comment,
    };

    return constructorDoc;
}

function _devdocMethodDetailsIfExist(
    methodSignature: string,
    devdocIfExists: DevdocOutput | undefined,
): string | undefined {
    let details;
    if (!_.isUndefined(devdocIfExists)) {
        const devdocMethodsIfExist = devdocIfExists.methods;
        if (!_.isUndefined(devdocMethodsIfExist)) {
            const devdocMethodIfExists = devdocMethodsIfExist[methodSignature];
            if (!_.isUndefined(devdocMethodIfExists)) {
                const devdocMethodDetailsIfExist = devdocMethodIfExists.details;
                if (!_.isUndefined(devdocMethodDetailsIfExist)) {
                    details = devdocMethodDetailsIfExist;
                }
            }
        }
    }
    return details;
}

function _genMethodDoc(
    abiDefinition: MethodAbi | FallbackAbi,
    devdocIfExists: DevdocOutput | undefined,
): SolidityMethod {
    const name = abiDefinition.type === 'fallback' ? '' : abiDefinition.name;

    const { parameters, methodSignature } =
        abiDefinition.type === 'fallback'
            ? { parameters: [], methodSignature: `${name}()` }
            : _genMethodParamsDoc(name, abiDefinition.inputs, devdocIfExists);

    const comment = _devdocMethodDetailsIfExist(methodSignature, devdocIfExists);

    const returnType =
        abiDefinition.type === 'fallback'
            ? { name: '', typeDocType: TypeDocTypes.Intrinsic }
            : _genMethodReturnTypeDoc(abiDefinition.outputs, methodSignature, devdocIfExists);

    const isConstant = abiDefinition.type === 'fallback' ? true : abiDefinition.constant;
    // TODO: determine whether fallback functions are always constant, as coded just above

    const methodDoc: SolidityMethod = {
        isConstructor: false,
        name,
        callPath: '', // TODO: wtf is this?
        parameters,
        returnType,
        isConstant,
        isPayable: abiDefinition.payable,
        comment,
    };
    return methodDoc;
}

function _genEventDoc(abiDefinition: EventAbi): Event {
    const eventDoc: Event = {
        name: abiDefinition.name,
        eventArgs: _genEventArgsDoc(abiDefinition.inputs, undefined),
    };
    return eventDoc;
}

function _genEventArgsDoc(args: DataItem[], devdocIfExists: DevdocOutput | undefined): EventArg[] {
    const eventArgsDoc: EventArg[] = [];

    for (const arg of args) {
        const name = arg.name;

        const type: Type = {
            name: arg.type,
            typeDocType: TypeDocTypes.Intrinsic,
        };

        const eventArgDoc: EventArg = {
            isIndexed: false, // TODO: wtf is this?
            name,
            type,
        };

        eventArgsDoc.push(eventArgDoc);
    }
    return eventArgsDoc;
}

/**
 * Extract documentation for each method paramater from @param params.
 */
function _genMethodParamsDoc(
    name: string,
    abiParams: DataItem[],
    devdocIfExists: DevdocOutput | undefined,
): { parameters: Parameter[]; methodSignature: string } {
    const parameters: Parameter[] = [];
    let methodSignature = `${name}(`;

    for (const abiParam of abiParams) {
        const parameter: Parameter = {
            name: abiParam.name,
            comment: '',
            isOptional: false, // Unsupported in Solidity, until resolution of https://github.com/ethereum/solidity/issues/232
            type: { name: abiParam.type, typeDocType: TypeDocTypes.Intrinsic },
        };
        parameters.push(parameter);
        methodSignature = `${methodSignature}${abiParam.type},`;
    }

    if (methodSignature.slice(-1) === ',') {
        methodSignature = methodSignature.slice(0, -1);
    }
    methodSignature += ')';

    if (!_.isUndefined(devdocIfExists)) {
        const devdocMethodIfExists = devdocIfExists.methods[methodSignature];
        if (!_.isUndefined(devdocMethodIfExists)) {
            const devdocParamsIfExist = devdocMethodIfExists.params;
            if (!_.isUndefined(devdocParamsIfExist)) {
                for (const parameter of parameters) {
                    parameter.comment = devdocParamsIfExist[parameter.name];
                }
            }
        }
    }

    return { parameters, methodSignature };
}

function _genMethodReturnTypeDoc(
    outputs: DataItem[],
    methodSignature: string,
    devdocIfExists: DevdocOutput | undefined,
): Type {
    const methodReturnTypeDoc: Type = {
        name: '',
        typeDocType: TypeDocTypes.Intrinsic,
        tupleElements: undefined,
    };
    if (outputs.length > 1) {
        methodReturnTypeDoc.typeDocType = TypeDocTypes.Tuple;
        methodReturnTypeDoc.tupleElements = [];
        for (const output of outputs) {
            methodReturnTypeDoc.tupleElements.push({ name: output.name, typeDocType: TypeDocTypes.Intrinsic });
        }
    } else if (outputs.length === 1) {
        methodReturnTypeDoc.typeDocType = TypeDocTypes.Intrinsic;
        methodReturnTypeDoc.name = outputs[0].name;
    }
    return methodReturnTypeDoc;
}
