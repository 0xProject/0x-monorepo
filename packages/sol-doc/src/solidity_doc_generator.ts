import * as path from 'path';

import {
    AbiDefinition,
    ConstructorAbi,
    DataItem,
    DevdocOutput,
    EventAbi,
    EventParameter,
    FallbackAbi,
    MethodAbi,
    StandardContractOutput,
} from 'ethereum-types';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { Compiler, CompilerOptions } from '@0xproject/sol-compiler';
import {
    CustomType,
    CustomTypeChild,
    DocAgnosticFormat,
    DocSection,
    Event,
    EventArg,
    Parameter,
    SolidityMethod,
    Type,
    TypeDocTypes,
} from '@0xproject/types';

// Unforunately, the only way to currently retrieve the declared structs within Solidity contracts
// is to tease them out of the params/return values included in the ABI. These structures do
// not include the structs actual name, so we need a mapping to assign the proper name to a
// struct. If the name is not in this mapping, the structs name will default to the param/return value
// name (which mostly coincide).
const customTypeHashToName: { [hash: string]: string } = {
    '52d4a768701076c7bac06e386e430883975eb398732eccba797fd09dd064a60e': 'Order',
    '46f7e8c4d144d11a72ce5338458ea37b933500d7a65e740cbca6d16e350eaa48': 'FillResult',
    c22239cf0d29df1e6cf1be54f21692a8c0b3a48b9367540d4ffff4608b331ce9: 'OrderInfo',
    c21e9ff31a30941c22e1cb43752114bb467c34dea58947f98966c9030fc8e4a9: 'TraderInfo',
    '07c2bddc165e0b5005e6244dd4a9771fa61c78c4f42abd687d57567b0768136c': 'MatchedFillResult',
};

/**
 * Invoke the Solidity compiler and transform its ABI and devdoc outputs into a
 * JSON format easily consumed by documentation rendering tools.
 * @param contractsToDocument list of contracts for which to generate doc objects
 * @param contractsDir the directory in which to find the `contractsToCompile` as well as their dependencies.
 * @return doc object for use with documentation generation tools.
 */
export async function generateSolDocAsync(
    contractsDir: string,
    contractsToDocument?: string[],
): Promise<DocAgnosticFormat> {
    const docWithDependencies: DocAgnosticFormat = {};
    const compilerOptions = _makeCompilerOptions(contractsDir, contractsToDocument);
    const compiler = new Compiler(compilerOptions);
    const compilerOutputs = await compiler.getCompilerOutputsAsync();
    let structs: CustomType[] = [];
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
                docWithDependencies[contractName] = _genDocSection(compiledContract, contractName);
                structs = [...structs, ..._extractStructs(compiledContract)];
            }
        }
    }
    structs = _dedupStructs(structs);
    structs = _overwriteStructNames(structs);

    let doc: DocAgnosticFormat = {};
    if (_.isUndefined(contractsToDocument) || contractsToDocument.length === 0) {
        doc = docWithDependencies;
    } else {
        for (const contractToDocument of contractsToDocument) {
            const contractBasename = path.basename(contractToDocument);
            const contractName =
                contractBasename.lastIndexOf('.sol') === -1
                    ? contractBasename
                    : contractBasename.substring(0, contractBasename.lastIndexOf('.sol'));
            doc[contractName] = docWithDependencies[contractName];
        }
    }

    doc.structs = {
        comment: '',
        constructors: [],
        methods: [],
        properties: [],
        types: structs,
        functions: [],
        events: [],
    };

    return doc;
}

function _makeCompilerOptions(contractsDir: string, contractsToCompile?: string[]): CompilerOptions {
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

    const shouldOverrideCatchAllContractsConfig = !_.isUndefined(contractsToCompile) && contractsToCompile.length > 0;
    if (shouldOverrideCatchAllContractsConfig) {
        compilerOptions.contracts = contractsToCompile;
    }

    return compilerOptions;
}

function _extractStructs(compiledContract: StandardContractOutput): CustomType[] {
    let customTypes: CustomType[] = [];
    for (const abiDefinition of compiledContract.abi) {
        let types: CustomType[] = [];
        switch (abiDefinition.type) {
            case 'constructor': {
                types = _getStructsAsCustomTypes(abiDefinition);
                break;
            }
            case 'function': {
                types = _getStructsAsCustomTypes(abiDefinition);
                break;
            }
            case 'event':
            case 'fallback':
                // No types exist
                break;
            default:
                throw new Error(
                    `unknown and unsupported AbiDefinition type '${(abiDefinition as AbiDefinition).type}'`,
                );
        }
        customTypes = [...customTypes, ...types];
    }
    return customTypes;
}

function _genDocSection(compiledContract: StandardContractOutput, contractName: string): DocSection {
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
                docSection.constructors.push(_genConstructorDoc(contractName, abiDefinition, compiledContract.devdoc));
                break;
            case 'event':
                (docSection.events as Event[]).push(_genEventDoc(abiDefinition));
                // note that we're not sending devdoc to _genEventDoc().
                // that's because the type of the events array doesn't have any fields for documentation!
                break;
            case 'function':
                docSection.methods.push(_genMethodDoc(abiDefinition, compiledContract.devdoc));
                break;
            case 'fallback':
                docSection.methods.push(_genFallbackDoc(abiDefinition, compiledContract.devdoc));
                break;
            default:
                throw new Error(
                    `unknown and unsupported AbiDefinition type '${(abiDefinition as AbiDefinition).type}'`,
                );
        }
    }

    return docSection;
}

function _genConstructorDoc(
    contractName: string,
    abiDefinition: ConstructorAbi,
    devdocIfExists: DevdocOutput | undefined,
): SolidityMethod {
    const { parameters, methodSignature } = _genMethodParamsDoc('', abiDefinition.inputs, devdocIfExists);

    const comment = _devdocMethodDetailsIfExist(methodSignature, devdocIfExists);

    const constructorDoc: SolidityMethod = {
        isConstructor: true,
        name: contractName,
        callPath: '',
        parameters,
        returnType: { name: contractName, typeDocType: TypeDocTypes.Reference }, // sad we have to specify this
        isConstant: false,
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

function _genFallbackDoc(abiDefinition: FallbackAbi, devdocIfExists: DevdocOutput | undefined): SolidityMethod {
    const methodSignature = `()`;
    const comment = _devdocMethodDetailsIfExist(methodSignature, devdocIfExists);

    const returnComment =
        _.isUndefined(devdocIfExists) || _.isUndefined(devdocIfExists.methods[methodSignature])
            ? undefined
            : devdocIfExists.methods[methodSignature].return;

    const methodDoc: SolidityMethod = {
        isConstructor: false,
        name: 'fallback',
        callPath: '',
        parameters: [],
        returnType: { name: 'void', typeDocType: TypeDocTypes.Intrinsic },
        returnComment,
        isConstant: true,
        isPayable: abiDefinition.payable,
        isFallback: true,
        comment: _.isEmpty(comment)
            ? 'The default fallback function. It is executed on a call to the contract if none of the other functions match the given function identifier (or if no data was supplied at all).'
            : comment,
    };
    return methodDoc;
}

function _genMethodDoc(abiDefinition: MethodAbi, devdocIfExists: DevdocOutput | undefined): SolidityMethod {
    const name = abiDefinition.name;
    const { parameters, methodSignature } = _genMethodParamsDoc(name, abiDefinition.inputs, devdocIfExists);
    const devDocComment = _devdocMethodDetailsIfExist(methodSignature, devdocIfExists);
    const returnType = _genMethodReturnTypeDoc(abiDefinition.outputs);
    const returnComment =
        _.isUndefined(devdocIfExists) || _.isUndefined(devdocIfExists.methods[methodSignature])
            ? undefined
            : devdocIfExists.methods[methodSignature].return;

    const hasNoNamedParameters = _.isUndefined(_.find(parameters, p => !_.isEmpty(p.name)));
    const isGeneratedGetter = hasNoNamedParameters;
    const comment =
        _.isEmpty(devDocComment) && isGeneratedGetter
            ? `This is an auto-generated accessor method of the '${name}' contract instance variable.`
            : devDocComment;
    const methodDoc: SolidityMethod = {
        isConstructor: false,
        name,
        callPath: '',
        parameters,
        returnType,
        returnComment,
        isConstant: abiDefinition.constant,
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

function _genEventArgsDoc(args: EventParameter[], devdocIfExists: DevdocOutput | undefined): EventArg[] {
    const eventArgsDoc: EventArg[] = [];

    for (const arg of args) {
        const name = arg.name;

        const type: Type = {
            name: arg.type,
            typeDocType: TypeDocTypes.Intrinsic,
        };

        const eventArgDoc: EventArg = {
            isIndexed: arg.indexed,
            name,
            type,
        };

        eventArgsDoc.push(eventArgDoc);
    }
    return eventArgsDoc;
}

/**
 * Extract documentation for each method parameter from @param params.
 */
function _genMethodParamsDoc(
    name: string,
    abiParams: DataItem[],
    devdocIfExists: DevdocOutput | undefined,
): { parameters: Parameter[]; methodSignature: string } {
    const parameters: Parameter[] = [];
    for (const abiParam of abiParams) {
        const type = _getTypeFromDataItem(abiParam);

        const parameter: Parameter = {
            name: abiParam.name,
            comment: '<No comment>',
            isOptional: false, // Unsupported in Solidity, until resolution of https://github.com/ethereum/solidity/issues/232
            type,
        };
        parameters.push(parameter);
    }

    const methodSignature = `${name}(${abiParams
        .map(abiParam => {
            return abiParam.type;
        })
        .join(',')})`;

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

function _genMethodReturnTypeDoc(outputs: DataItem[]): Type {
    if (outputs.length > 1) {
        const type: Type = {
            name: '',
            typeDocType: TypeDocTypes.Tuple,
            tupleElements: [],
        };
        for (const output of outputs) {
            const tupleType = _getTypeFromDataItem(output);
            (type.tupleElements as Type[]).push(tupleType);
        }
        return type;
    } else if (outputs.length === 1) {
        const output = outputs[0];
        const type = _getTypeFromDataItem(output);
        return type;
    } else {
        const type: Type = {
            name: 'void',
            typeDocType: TypeDocTypes.Intrinsic,
        };
        return type;
    }
}

function _capitalize(text: string): string {
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function _dedupStructs(customTypes: CustomType[]): CustomType[] {
    const uniqueCustomTypes: CustomType[] = [];
    const seenTypes: { [hash: string]: boolean } = {};
    _.each(customTypes, customType => {
        const hash = _generateCustomTypeHash(customType);
        if (!seenTypes[hash]) {
            uniqueCustomTypes.push(customType);
            seenTypes[hash] = true;
        }
    });
    return uniqueCustomTypes;
}

function _overwriteStructNames(customTypes: CustomType[]): CustomType[] {
    const localCustomTypes = _.cloneDeep(customTypes);
    _.each(localCustomTypes, customType => {
        const hash = _generateCustomTypeHash(customType);
        if (!_.isUndefined(customTypeHashToName[hash])) {
            customType.name = customTypeHashToName[hash];
        }
    });
    return localCustomTypes;
}

function _generateCustomTypeHash(customType: CustomType): string {
    const customTypeWithoutName = _.cloneDeep(customType);
    delete customTypeWithoutName.name;
    const customTypeWithoutNameStr = JSON.stringify(customTypeWithoutName);
    const hash = ethUtil.sha256(customTypeWithoutNameStr).toString('hex');
    return hash;
}

function _getStructsAsCustomTypes(abiDefinition: AbiDefinition): CustomType[] {
    const customTypes: CustomType[] = [];
    if (!_.isUndefined((abiDefinition as any).inputs)) {
        const methodOrConstructorAbi = abiDefinition as MethodAbi | ConstructorAbi;
        _.each(methodOrConstructorAbi.inputs, input => {
            if (!_.isUndefined(input.components)) {
                const customType = _getCustomTypeFromDataItem(input);
                customTypes.push(customType);
            }
        });
    }
    if (!_.isUndefined((abiDefinition as any).outputs)) {
        const methodAbi = abiDefinition as MethodAbi;
        _.each(methodAbi.outputs, output => {
            if (!_.isUndefined(output.components)) {
                const customType = _getCustomTypeFromDataItem(output);
                customTypes.push(customType);
            }
        });
    }
    return customTypes;
}

function _getCustomTypeFromDataItem(inputOrOutput: DataItem): CustomType {
    const customType: CustomType = {
        name: _.capitalize(inputOrOutput.name),
        kindString: 'Interface',
        children: [],
    };
    _.each(inputOrOutput.components, (component: DataItem) => {
        const childType = _getTypeFromDataItem(component);
        const customTypeChild = {
            name: component.name,
            type: childType,
        };
        // (fabio): Not sure why this type casting is necessary. Seems TS doesn't
        // deduce that `customType.children` cannot be undefined anymore after being
        // set to `[]` above.
        (customType.children as CustomTypeChild[]).push(customTypeChild);
    });
    return customType;
}

function _getNameFromDataItemIfExists(dataItem: DataItem): string | undefined {
    if (_.isUndefined(dataItem.components)) {
        return undefined;
    }
    const customType = _getCustomTypeFromDataItem(dataItem);
    const hash = _generateCustomTypeHash(customType);
    if (_.isUndefined(customTypeHashToName[hash])) {
        return undefined;
    }
    return customTypeHashToName[hash];
}

function _getTypeFromDataItem(dataItem: DataItem): Type {
    const typeDocType = !_.isUndefined(dataItem.components) ? TypeDocTypes.Reference : TypeDocTypes.Intrinsic;
    let typeName: string;
    if (typeDocType === TypeDocTypes.Reference) {
        const nameIfExists = _getNameFromDataItemIfExists(dataItem);
        typeName = _.isUndefined(nameIfExists) ? _capitalize(dataItem.name) : nameIfExists;
    } else {
        typeName = dataItem.type;
    }

    const isArrayType = _.endsWith(dataItem.type, '[]');
    let type: Type;
    if (isArrayType) {
        typeName = typeDocType === TypeDocTypes.Intrinsic ? typeName.slice(0, -2) : typeName;
        type = {
            elementType: { name: typeName, typeDocType },
            typeDocType: TypeDocTypes.Array,
            name: '',
        };
    } else {
        type = { name: typeName, typeDocType };
    }
    return type;
}
