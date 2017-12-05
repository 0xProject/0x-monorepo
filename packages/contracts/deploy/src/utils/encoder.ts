import * as _ from 'lodash';
import * as Web3 from 'web3';
import * as web3Abi from 'web3-eth-abi';

import {AbiType} from './types';

export const encoder = {
    encodeConstructorArgsFromAbi(args: any[], abi: Web3.ContractAbi): string {
        const constructorTypes: string[] = [];
        _.each(abi, (element: Web3.AbiDefinition) => {
            if (element.type === AbiType.Constructor) {
                _.each(element.inputs, (input: Web3.FunctionParameter) => {
                    constructorTypes.push(input.type);
                });
            }
        });
        const encodedParameters = web3Abi.encodeParameters(constructorTypes, args);
        return encodedParameters;
    },
};
