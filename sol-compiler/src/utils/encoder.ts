import { AbiDefinition, AbiType, ConstructorAbi, ContractAbi, DataItem } from 'ethereum-types';
import * as _ from 'lodash';
import * as web3Abi from 'web3-eth-abi';

export const encoder = {
    encodeConstructorArgsFromAbi(args: any[], abi: ContractAbi): string {
        const constructorTypes: string[] = [];
        _.each(abi, (element: AbiDefinition) => {
            if (element.type === AbiType.Constructor) {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const constuctorAbi = element as ConstructorAbi;
                _.each(constuctorAbi.inputs, (input: DataItem) => {
                    constructorTypes.push(input.type);
                });
            }
        });
        const encodedParameters = web3Abi.encodeParameters(constructorTypes, args);
        return encodedParameters;
    },
};
