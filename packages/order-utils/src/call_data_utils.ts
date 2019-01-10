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
            const selector = new AbiEncoder.Method(methodAbi).getSelector();
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
    const method = new AbiEncoder.Method(abi);
    /**
     * HACK(leo) Sometimes we want to decode smth as smth else. e.g. `Error(string)` as `Error(bytes)`.
     * In that case `abiBySelector` has the ABI of the later and the `selector` of the first.
     * `AbiEncoder.Method` will recompute it's own selector and check that it matches the one found in data.
     * To suspend that behaviour we override it here.
     */
    (method as any)._methodSelector = selector;
    const decodedParams = method.decode(callDataHex);
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
