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

import { Compiler, CompilerOptions } from '@0x/sol-compiler';
import {
    CustomType,
    CustomTypeChild,
    DocAgnosticFormat,
    DocSection,
    Event,
    EventArg,
    ObjectMap,
    Parameter,
    SolidityMethod,
    Type,
    TypeDocTypes,
} from '@0x/types';

export class SolDoc {
    private _customTypeHashToName: ObjectMap<string> | undefined;
    private static _genEventDoc(abiDefinition: EventAbi): Event {
        const eventDoc: Event = {
            name: abiDefinition.name,
            eventArgs: SolDoc._genEventArgsDoc(abiDefinition.inputs),
        };
        return eventDoc;
    }
    private static _devdocMethodDetailsIfExist(
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
    private static _genFallbackDoc(
        abiDefinition: FallbackAbi,
        devdocIfExists: DevdocOutput | undefined,
    ): SolidityMethod {
        const methodSignature = `()`;
        const comment = SolDoc._devdocMethodDetailsIfExist(methodSignature, devdocIfExists);

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
                ? 'The fallback function. It is executed on a call to the contract if none of the other functions match the given public identifier (or if no data was supplied at all).'
                : comment,
        };
        return methodDoc;
    }
    private static _genEventArgsDoc(args: EventParameter[]): EventArg[] {
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
    private static _dedupStructs(customTypes: CustomType[]): CustomType[] {
        const uniqueCustomTypes: CustomType[] = [];
        const seenTypes: { [hash: string]: boolean } = {};
        _.each(customTypes, customType => {
            const hash = SolDoc._generateCustomTypeHash(customType);
            if (!seenTypes[hash]) {
                uniqueCustomTypes.push(customType);
                seenTypes[hash] = true;
            }
        });
        return uniqueCustomTypes;
    }
    private static _capitalize(text: string): string {
        return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
    }
    private static _generateCustomTypeHash(customType: CustomType): string {
        const customTypeWithoutName = _.cloneDeep(customType);
        delete customTypeWithoutName.name;
        const customTypeWithoutNameStr = JSON.stringify(customTypeWithoutName);
        const hash = ethUtil.sha256(customTypeWithoutNameStr).toString('hex');
        return hash;
    }
    private static _makeCompilerOptions(contractsDir: string, contractsToCompile?: string[]): CompilerOptions {
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

        const shouldOverrideCatchAllContractsConfig =
            !_.isUndefined(contractsToCompile) && contractsToCompile.length > 0;
        if (shouldOverrideCatchAllContractsConfig) {
            compilerOptions.contracts = contractsToCompile;
        }

        return compilerOptions;
    }
    /**
     * Invoke the Solidity compiler and transform its ABI and devdoc outputs into a
     * JSON format easily consumed by documentation rendering tools.
     * @param contractsToDocument list of contracts for which to generate doc objects
     * @param contractsDir the directory in which to find the `contractsToCompile` as well as their dependencies.
     * @return doc object for use with documentation generation tools.
     */
    public async generateSolDocAsync(
        contractsDir: string,
        contractsToDocument?: string[],
        customTypeHashToName?: ObjectMap<string>,
    ): Promise<DocAgnosticFormat> {
        this._customTypeHashToName = customTypeHashToName;
        const docWithDependencies: DocAgnosticFormat = {};
        const compilerOptions = SolDoc._makeCompilerOptions(contractsDir, contractsToDocument);
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
                    docWithDependencies[contractName] = this._genDocSection(compiledContract, contractName);
                    structs = [...structs, ...this._extractStructs(compiledContract)];
                }
            }
        }
        structs = SolDoc._dedupStructs(structs);
        structs = this._overwriteStructNames(structs);

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

        if (structs.length > 0) {
            doc.structs = {
                comment: '',
                constructors: [],
                methods: [],
                properties: [],
                types: structs,
                functions: [],
                events: [],
            };
        }

        delete this._customTypeHashToName; // Clean up instance state
        return doc;
    }
    private _getCustomTypeFromDataItem(inputOrOutput: DataItem): CustomType {
        const customType: CustomType = {
            name: _.capitalize(inputOrOutput.name),
            kindString: 'Interface',
            children: [],
        };
        _.each(inputOrOutput.components, (component: DataItem) => {
            const childType = this._getTypeFromDataItem(component);
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
    private _getNameFromDataItemIfExists(dataItem: DataItem): string | undefined {
        if (_.isUndefined(dataItem.components)) {
            return undefined;
        }
        const customType = this._getCustomTypeFromDataItem(dataItem);
        const hash = SolDoc._generateCustomTypeHash(customType);
        if (_.isUndefined(this._customTypeHashToName) || _.isUndefined(this._customTypeHashToName[hash])) {
            return undefined;
        }
        return this._customTypeHashToName[hash];
    }
    private _getTypeFromDataItem(dataItem: DataItem): Type {
        const typeDocType = !_.isUndefined(dataItem.components) ? TypeDocTypes.Reference : TypeDocTypes.Intrinsic;
        let typeName: string;
        if (typeDocType === TypeDocTypes.Reference) {
            const nameIfExists = this._getNameFromDataItemIfExists(dataItem);
            typeName = _.isUndefined(nameIfExists) ? SolDoc._capitalize(dataItem.name) : nameIfExists;
        } else {
            typeName = dataItem.type;
        }

        const isArrayType = _.endsWith(dataItem.type, '[]');
        let type: Type;
        if (isArrayType) {
            // tslint:disable-next-line:custom-no-magic-numbers
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
    private _overwriteStructNames(customTypes: CustomType[]): CustomType[] {
        if (_.isUndefined(this._customTypeHashToName)) {
            return customTypes;
        }
        const localCustomTypes = _.cloneDeep(customTypes);
        _.each(localCustomTypes, (customType, i) => {
            const hash = SolDoc._generateCustomTypeHash(customType);
            if (!_.isUndefined(this._customTypeHashToName) && !_.isUndefined(this._customTypeHashToName[hash])) {
                localCustomTypes[i].name = this._customTypeHashToName[hash];
            }
        });
        return localCustomTypes;
    }
    private _extractStructs(compiledContract: StandardContractOutput): CustomType[] {
        let customTypes: CustomType[] = [];
        for (const abiDefinition of compiledContract.abi) {
            let types: CustomType[] = [];
            switch (abiDefinition.type) {
                case 'constructor': {
                    types = this._getStructsAsCustomTypes(abiDefinition);
                    break;
                }
                case 'function': {
                    types = this._getStructsAsCustomTypes(abiDefinition);
                    break;
                }
                case 'event':
                case 'fallback':
                    // No types exist
                    break;
                default:
                    throw new Error(
                        `unknown and unsupported AbiDefinition type '${(abiDefinition as AbiDefinition).type}'`, // tslint:disable-line:no-unnecessary-type-assertion
                    );
            }
            customTypes = [...customTypes, ...types];
        }
        return customTypes;
    }
    private _genDocSection(compiledContract: StandardContractOutput, contractName: string): DocSection {
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
                    docSection.constructors.push(
                        // tslint:disable-next-line:no-unnecessary-type-assertion
                        this._genConstructorDoc(contractName, abiDefinition as ConstructorAbi, compiledContract.devdoc),
                    );
                    break;
                case 'event':
                    // tslint:disable-next-line:no-unnecessary-type-assertion
                    (docSection.events as Event[]).push(SolDoc._genEventDoc(abiDefinition as EventAbi));
                    // note that we're not sending devdoc to this._genEventDoc().
                    // that's because the type of the events array doesn't have any fields for documentation!
                    break;
                case 'function':
                    // tslint:disable-next-line:no-unnecessary-type-assertion
                    docSection.methods.push(this._genMethodDoc(abiDefinition as MethodAbi, compiledContract.devdoc));
                    break;
                case 'fallback':
                    // tslint:disable-next-line:no-unnecessary-type-assertion
                    docSection.methods.push(
                        SolDoc._genFallbackDoc(abiDefinition as FallbackAbi, compiledContract.devdoc),
                    );
                    break;
                default:
                    throw new Error(
                        `unknown and unsupported AbiDefinition type '${(abiDefinition as AbiDefinition).type}'`, // tslint:disable-line:no-unnecessary-type-assertion
                    );
            }
        }

        return docSection;
    }
    private _genConstructorDoc(
        contractName: string,
        abiDefinition: ConstructorAbi,
        devdocIfExists: DevdocOutput | undefined,
    ): SolidityMethod {
        const { parameters, methodSignature } = this._genMethodParamsDoc('', abiDefinition.inputs, devdocIfExists);

        const comment = SolDoc._devdocMethodDetailsIfExist(methodSignature, devdocIfExists);

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
    private _genMethodDoc(abiDefinition: MethodAbi, devdocIfExists: DevdocOutput | undefined): SolidityMethod {
        const name = abiDefinition.name;
        const { parameters, methodSignature } = this._genMethodParamsDoc(name, abiDefinition.inputs, devdocIfExists);
        const devDocComment = SolDoc._devdocMethodDetailsIfExist(methodSignature, devdocIfExists);
        const returnType = this._genMethodReturnTypeDoc(abiDefinition.outputs);
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
    /**
     * Extract documentation for each method parameter from @param params.
     */
    private _genMethodParamsDoc(
        name: string,
        abiParams: DataItem[],
        devdocIfExists: DevdocOutput | undefined,
    ): { parameters: Parameter[]; methodSignature: string } {
        const parameters: Parameter[] = [];
        for (const abiParam of abiParams) {
            const type = this._getTypeFromDataItem(abiParam);

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
                if (!_.startsWith(abiParam.type, 'tuple')) {
                    return abiParam.type;
                } else {
                    // Need to expand tuples:
                    // E.g: fillOrder(tuple,uint256,bytes) -> fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)
                    const isArray = _.endsWith(abiParam.type, '[]');
                    const expandedTypes = _.map(abiParam.components, c => c.type);
                    const type = `(${expandedTypes.join(',')})${isArray ? '[]' : ''}`;
                    return type;
                }
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
    private _genMethodReturnTypeDoc(outputs: DataItem[]): Type {
        let type: Type;
        if (outputs.length > 1) {
            type = {
                name: '',
                typeDocType: TypeDocTypes.Tuple,
                tupleElements: [],
            };
            for (const output of outputs) {
                const tupleType = this._getTypeFromDataItem(output);
                (type.tupleElements as Type[]).push(tupleType);
            }
            return type;
        } else if (outputs.length === 1) {
            const output = outputs[0];
            type = this._getTypeFromDataItem(output);
        } else {
            type = {
                name: 'void',
                typeDocType: TypeDocTypes.Intrinsic,
            };
        }
        return type;
    }
    private _getStructsAsCustomTypes(abiDefinition: AbiDefinition): CustomType[] {
        const customTypes: CustomType[] = [];
        // We cast to `any` here because we do not know yet if this type of abiDefinition contains
        // an `input` key
        if (!_.isUndefined((abiDefinition as any).inputs)) {
            const methodOrConstructorAbi = abiDefinition as MethodAbi | ConstructorAbi;
            _.each(methodOrConstructorAbi.inputs, input => {
                if (!_.isUndefined(input.components)) {
                    const customType = this._getCustomTypeFromDataItem(input);
                    customTypes.push(customType);
                }
            });
        }
        if (!_.isUndefined((abiDefinition as any).outputs)) {
            const methodAbi = abiDefinition as MethodAbi; // tslint:disable-line:no-unnecessary-type-assertion
            _.each(methodAbi.outputs, output => {
                if (!_.isUndefined(output.components)) {
                    const customType = this._getCustomTypeFromDataItem(output);
                    customTypes.push(customType);
                }
            });
        }
        return customTypes;
    }
}
// tslint:disable:max-file-line-count
