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
    private _savedABIs: AbiDefinition[] = [];
    private _methodIds: { [signatureHash: string]: EventAbi } = {};
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
        const logData = log.data;
        const decodedParams: DecodedLogArgs = {};
        let topicsIndex = 1;

        const nonIndexedInputs = _.filter(event.inputs, input => !input.indexed);
        const dataTypes = _.map(nonIndexedInputs, input => input.type);
        const decodedData = ethersInterface.events[event.name].parse(log.data);

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
        this._savedABIs = this._savedABIs.concat(abiArray);
    }
}
