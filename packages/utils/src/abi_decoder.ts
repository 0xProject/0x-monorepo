import {
    AbiDefinition,
    AbiType,
    DecodedLogArgs,
    EventAbi,
    EventParameter,
    LogEntry,
    LogWithDecodedArgs,
    RawLog,
    SolidityTypes,
} from 'ethereum-types';
import * as ethers from 'ethers';
import * as _ from 'lodash';

import { addressUtils } from './address_utils';
import { BigNumber } from './configured_bignumber';

export class AbiDecoder {
    private readonly _methodIds: { [signatureHash: string]: EventAbi } = {};
    constructor(abiArrays: AbiDefinition[][]) {
        _.forEach(abiArrays, this.addABI.bind(this));
    }
    // This method can only decode logs from the 0x & ERC20 smart contracts
    public tryToDecodeLogOrNoop<ArgsType extends DecodedLogArgs>(log: LogEntry): LogWithDecodedArgs<ArgsType> | RawLog {
        const methodId = log.topics[0];
        const event = this._methodIds[methodId];
        if (_.isUndefined(event)) {
            return log;
        }
        const ethersInterface = new ethers.Interface([event]);
        const decodedParams: DecodedLogArgs = {};
        let topicsIndex = 1;

        let decodedData: any[];
        try {
            decodedData = ethersInterface.events[event.name].parse(log.data);
        } catch (error) {
            if (error.code === ethers.errors.INVALID_ARGUMENT) {
                // Because we index events by Method ID, and Method IDs are derived from the method
                // name and the input parameters, it's possible that the return value of the event
                // does not match our ABI. If that's the case, then ethers will throw an error
                // when we try to parse the event. We handle that case here by returning the log rather
                // than throwing an error.
                return log;
            }
            throw error;
        }

        let didFailToDecode = false;
        _.forEach(event.inputs, (param: EventParameter, i: number) => {
            // Indexed parameters are stored in topics. Non-indexed ones in decodedData
            let value: BigNumber | string | number = param.indexed ? log.topics[topicsIndex++] : decodedData[i];
            if (_.isUndefined(value)) {
                didFailToDecode = true;
                return;
            }
            if (param.type === SolidityTypes.Address) {
                const baseHex = 16;
                value = addressUtils.padZeros(new BigNumber(value).toString(baseHex));
            } else if (param.type === SolidityTypes.Uint256 || param.type === SolidityTypes.Uint) {
                value = new BigNumber(value);
            } else if (param.type === SolidityTypes.Uint8) {
                value = new BigNumber(value).toNumber();
            }
            decodedParams[param.name] = value;
        });

        if (didFailToDecode) {
            return log;
        } else {
            return {
                ...log,
                event: event.name,
                args: decodedParams,
            };
        }
    }
    public addABI(abiArray: AbiDefinition[]): void {
        if (_.isUndefined(abiArray)) {
            return;
        }
        const ethersInterface = new ethers.Interface(abiArray);
        _.map(abiArray, (abi: AbiDefinition) => {
            if (abi.type === AbiType.Event) {
                const topic = ethersInterface.events[abi.name].topics[0];
                this._methodIds[topic] = abi;
            }
        });
    }
}
