import { AbiDefinition, AbiType, ConstructorAbi, ContractAbi, DataItem, MethodAbi } from '@0xproject/types';
import * as _ from 'lodash';

export const abiUtils = {
    parseFunctionParam(param: DataItem): string {
        if (param.type === 'tuple') {
            // Parse out tuple types into {type_1, type_2, ..., type_N}
            const tupleComponents = param.components;
            const paramString = _.map(tupleComponents, component => this.parseFunctionParam(component));
            const tupleParamString = `{${paramString}}`;
            return tupleParamString;
        }
        return param.type;
    },
    getFunctionSignature(abi: MethodAbi): string {
        const functionName = abi.name;
        const parameterTypeList = abi.inputs.map((param: DataItem) => this.parseFunctionParam(param));
        const functionSignature = `${functionName}(${parameterTypeList})`;
        return functionSignature;
    },
    renameOverloadedMethods(inputContractAbi: ContractAbi): ContractAbi {
        const contractAbi = _.cloneDeep(inputContractAbi);
        const methodAbis = contractAbi.filter((abi: AbiDefinition) => abi.type === AbiType.Function) as MethodAbi[];
        const methodAbisByOriginalIndex = _.transform(
            methodAbis,
            (result: Array<{ index: number; methodAbi: MethodAbi }>, methodAbi, i: number) => {
                result.push({ index: i, methodAbi });
            },
            [],
        );
        // Sort method Abis into alphabetical order, by function signature
        const methodAbisByOriginalIndexOrdered = _.sortBy(methodAbisByOriginalIndex, [
            (entry: { index: number; methodAbi: MethodAbi }) => {
                const functionSignature = this.getFunctionSignature(entry.methodAbi);
                return functionSignature;
            },
        ]);
        // Group method Abis by name (overloaded methods will be grouped together, in alphabetical order)
        const methodAbisByName = _.transform(
            methodAbisByOriginalIndexOrdered,
            (result: { [key: string]: Array<{ index: number; methodAbi: MethodAbi }> }, entry) => {
                (result[entry.methodAbi.name] || (result[entry.methodAbi.name] = [])).push(entry);
            },
            {},
        );
        // Rename overloaded methods to overloadedMethoName_1, overloadedMethoName_2, ...
        const methodAbisRenamed = _.transform(
            methodAbisByName,
            (result: MethodAbi[], methodAbisWithSameName: Array<{ index: number; methodAbi: MethodAbi }>) => {
                _.forEach(methodAbisWithSameName, (entry, i: number) => {
                    if (methodAbisWithSameName.length > 1) {
                        const overloadedMethodId = i + 1;
                        const sanitizedMethodName = `${entry.methodAbi.name}_${overloadedMethodId}`;
                        const indexOfExistingAbiWithSanitizedMethodNameIfExists = _.findIndex(
                            methodAbis,
                            methodAbi => methodAbi.name === sanitizedMethodName,
                        );
                        if (indexOfExistingAbiWithSanitizedMethodNameIfExists >= 0) {
                            const methodName = entry.methodAbi.name;
                            throw new Error(
                                `Failed to rename overloaded method '${methodName}' to '${sanitizedMethodName}'. A method with this name already exists.`,
                            );
                        }
                        entry.methodAbi.name = sanitizedMethodName;
                    }
                    // Add method to list of ABIs in its original position
                    result.splice(entry.index, 0, entry.methodAbi);
                });
            },
            [...Array(methodAbis.length)],
        );
        return contractAbi;
    },
};
