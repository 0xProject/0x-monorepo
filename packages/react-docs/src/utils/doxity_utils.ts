import * as _ from 'lodash';

import {
    AbiTypes,
    DocAgnosticFormat,
    DocSection,
    DoxityAbiDoc,
    DoxityContractObj,
    DoxityDocObj,
    DoxityInput,
    EventArg,
    Parameter,
    Property,
    SolidityMethod,
    Type,
    TypeDocTypes,
} from '../types';

export const doxityUtils = {
    convertToDocAgnosticFormat(doxityDocObj: DoxityDocObj): DocAgnosticFormat {
        const docAgnosticFormat: DocAgnosticFormat = {};
        _.each(doxityDocObj, (doxityContractObj: DoxityContractObj, contractName: string) => {
            const doxityConstructor = _.find(doxityContractObj.abiDocs, (abiDoc: DoxityAbiDoc) => {
                return abiDoc.type === AbiTypes.Constructor;
            });
            const constructors = [];
            if (!_.isUndefined(doxityConstructor)) {
                const constructor = {
                    isConstructor: true,
                    name: doxityContractObj.name,
                    comment: doxityConstructor.details,
                    returnComment: doxityConstructor.return,
                    callPath: '',
                    parameters: this._convertParameters(doxityConstructor.inputs),
                    returnType: this._convertType(doxityContractObj.name),
                };
                constructors.push(constructor);
            }

            const doxityMethods: DoxityAbiDoc[] = _.filter<DoxityAbiDoc>(
                doxityContractObj.abiDocs,
                (abiDoc: DoxityAbiDoc) => {
                    return this._isMethod(abiDoc);
                },
            );
            const methods: SolidityMethod[] = _.map<DoxityAbiDoc, SolidityMethod>(
                doxityMethods,
                (doxityMethod: DoxityAbiDoc) => {
                    const outputs = !_.isUndefined(doxityMethod.outputs) ? doxityMethod.outputs : [];
                    let returnTypeIfExists: Type;
                    if (outputs.length === 0) {
                        // no-op. It's already undefined
                    } else if (outputs.length === 1) {
                        const outputsType = outputs[0].type;
                        returnTypeIfExists = this._convertType(outputsType);
                    } else {
                        const outputsType = `[${_.map(outputs, output => output.type).join(', ')}]`;
                        returnTypeIfExists = this._convertType(outputsType);
                    }
                    // For ZRXToken, we want to convert it to zrxToken, rather then simply zRXToken
                    const callPath =
                        contractName !== 'ZRXToken'
                            ? `${contractName[0].toLowerCase()}${contractName.slice(1)}.`
                            : `${contractName.slice(0, 3).toLowerCase()}${contractName.slice(3)}.`;
                    const method = {
                        isConstructor: false,
                        isConstant: doxityMethod.constant,
                        isPayable: doxityMethod.payable,
                        name: doxityMethod.name,
                        comment: doxityMethod.details,
                        returnComment: doxityMethod.return,
                        callPath,
                        parameters: this._convertParameters(doxityMethod.inputs),
                        returnType: returnTypeIfExists,
                    };
                    return method;
                },
            );

            const doxityProperties: DoxityAbiDoc[] = _.filter<DoxityAbiDoc>(
                doxityContractObj.abiDocs,
                (abiDoc: DoxityAbiDoc) => {
                    return this._isProperty(abiDoc);
                },
            );
            const properties = _.map<DoxityAbiDoc, Property>(doxityProperties, (doxityProperty: DoxityAbiDoc) => {
                // We assume that none of our functions return more then a single return value
                let typeName = doxityProperty.outputs[0].type;
                if (!_.isEmpty(doxityProperty.inputs)) {
                    // Properties never have more then a single input
                    typeName = `(${doxityProperty.inputs[0].type} => ${typeName})`;
                }
                const property = {
                    name: doxityProperty.name,
                    type: this._convertType(typeName),
                    comment: doxityProperty.details,
                };
                return property;
            });

            const doxityEvents = _.filter(
                doxityContractObj.abiDocs,
                (abiDoc: DoxityAbiDoc) => abiDoc.type === AbiTypes.Event,
            );
            const events = _.map(doxityEvents, doxityEvent => {
                const event = {
                    name: doxityEvent.name,
                    eventArgs: this._convertEventArgs(doxityEvent.inputs),
                };
                return event;
            });

            const docSection: DocSection = {
                comment: doxityContractObj.title,
                constructors,
                methods,
                properties,
                types: [],
                functions: [],
                events,
            };
            docAgnosticFormat[contractName] = docSection;
        });
        return docAgnosticFormat;
    },
    _convertParameters(inputs: DoxityInput[]): Parameter[] {
        const parameters = _.map(inputs, input => {
            const parameter = {
                name: input.name,
                comment: input.description,
                isOptional: false,
                type: this._convertType(input.type),
            };
            return parameter;
        });
        return parameters;
    },
    _convertType(typeName: string): Type {
        const type = {
            name: typeName,
            typeDocType: TypeDocTypes.Intrinsic,
        };
        return type;
    },
    _isMethod(abiDoc: DoxityAbiDoc): boolean {
        if (abiDoc.type !== AbiTypes.Function) {
            return false;
        }
        const hasInputs = !_.isEmpty(abiDoc.inputs);
        const hasNamedOutputIfExists = !hasInputs || !_.isEmpty(abiDoc.inputs[0].name);
        const isNameAllCaps = abiDoc.name === abiDoc.name.toUpperCase();
        const isMethod = hasNamedOutputIfExists && !isNameAllCaps;
        return isMethod;
    },
    _isProperty(abiDoc: DoxityAbiDoc): boolean {
        if (abiDoc.type !== AbiTypes.Function) {
            return false;
        }
        const hasInputs = !_.isEmpty(abiDoc.inputs);
        const hasNamedOutputIfExists = !hasInputs || !_.isEmpty(abiDoc.inputs[0].name);
        const isNameAllCaps = abiDoc.name === abiDoc.name.toUpperCase();
        const isProperty = !hasNamedOutputIfExists || isNameAllCaps;
        return isProperty;
    },
    _convertEventArgs(inputs: DoxityInput[]): EventArg[] {
        const eventArgs = _.map(inputs, input => {
            const eventArg = {
                isIndexed: input.indexed,
                name: input.name,
                type: this._convertType(input.type),
            };
            return eventArg;
        });
        return eventArgs;
    },
};
