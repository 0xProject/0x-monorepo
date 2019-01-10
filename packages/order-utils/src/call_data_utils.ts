import { AbiEncoder } from '@0x/utils';
import { MethodAbi } from 'ethereum-types';
import * as ethers from 'ethers';
import * as _ from 'lodash';

import { constants } from './constants';

export interface CallParams {
    [paramName: string]: any;
}

export interface DecodedCallData {
    name: string;
    callParams: CallParams;
}

export interface AbiBySelector {
    [selector: string]: MethodAbi;
}
/**
 * Converts the list of ABIs to the hash indexed by the 4-byte selector.
 */
export function abisToAbiBySelector(abis: MethodAbi[]): AbiBySelector {
    const abiBySelector = _.reduce<MethodAbi, AbiBySelector>(
        abis,
        (abiBySelectorAccumulator: AbiBySelector, methodAbi: MethodAbi) => {
            const selector = getMethodSelector(methodAbi);
            return {
                ...abiBySelectorAccumulator,
                [selector]: methodAbi,
            };
        },
        {},
    );
    return abiBySelector;
}

/**
 * Computes the 4-byte selector of the method.
 * @param methodAbi Method ABI
 */
export function getMethodSelector(methodAbi: MethodAbi): string {
    const selector = new AbiEncoder.Method(methodAbi).getSelector();
    return selector;
}
/**
 * Decoded call data into function name and params using the provided ABIs.
 * @param abiBySelector Hash of ABI indexed by 4-byte selector
 * @param callDataHex Call data to decode
 */
export function decodeCallData(abiBySelector: AbiBySelector, callDataHex: string): DecodedCallData {
    const selector = ethers.utils.hexDataSlice(callDataHex, 0, constants.SELECTOR_LENGTH);
    const abi = abiBySelector[selector];
    if (_.isUndefined(abi)) {
        throw new Error(`Unable to decode call data. Unknown selector ${selector}`);
    }
    const decodedParams = new AbiEncoder.Method(abi).decode(
        callDataHex,
        AbiEncoder.constants.DEFAULT_DECODING_RULES,
        selector,
    );
    // decodedParams have params as both an array and an object. We just want the object.
    const callParams = _.reduce<any, CallParams>(
        decodedParams,
        (partialCallParamsAccumuator: CallParams, decodedParam: any, idx: number) => {
            const name = abi.inputs[idx].name;
            if (_.isUndefined(name)) {
                throw new Error(
                    `Unable to decode call data params. Name is missing for param with index ${idx}. Check your ABI`,
                );
            }
            partialCallParamsAccumuator[name] = decodedParam;
            return partialCallParamsAccumuator;
        },
        {},
    );
    const decodedCallData = {
        name: abi.name,
        callParams,
    };
    return decodedCallData;
}
