import { AbiDefinition, AbiType, ConstructorAbi, ContractAbi, DataItem, MethodAbi } from 'ethereum-types';
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
    getFunctionSignature(methodAbi: MethodAbi): string {
        const functionName = methodAbi.name;
        const parameterTypeList = _.map(methodAbi.inputs, (param: DataItem) => this.parseFunctionParam(param));
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
                const functionSignature = this.getFunctionSignature(methodAbi);
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
