import { AbiType, DecodedLogArgs, LogWithDecodedArgs, RawLog, SolidityTypes } from '@0xproject/types';
import * as ethersContracts from 'ethers-contracts';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { BigNumber } from './configured_bignumber';

export class AbiDecoder {
    private _savedABIs: Web3.AbiDefinition[] = [];
    private _methodIds: { [signatureHash: string]: Web3.EventAbi } = {};
    private static _padZeros(address: string) {
        let formatted = address;
        if (_.startsWith(formatted, '0x')) {
            formatted = formatted.slice(2);
        }

        formatted = _.padStart(formatted, 40, '0');
        return `0x${formatted}`;
    }
    constructor(abiArrays: Web3.AbiDefinition[][]) {
        _.forEach(abiArrays, this._addABI.bind(this));
    }
    // This method can only decode logs from the 0x & ERC20 smart contracts
    public tryToDecodeLogOrNoop<ArgsType>(log: Web3.LogEntry): LogWithDecodedArgs<ArgsType> | RawLog {
        const methodId = log.topics[0];
        const event = this._methodIds[methodId];
        if (_.isUndefined(event)) {
            return log;
        }
        const ethersInterface = new ethersContracts.Interface([event]);
        const logData = log.data;
        const decodedParams: DecodedLogArgs = {};
        let topicsIndex = 1;

        const nonIndexedInputs = _.filter(event.inputs, input => !input.indexed);
        const dataTypes = _.map(nonIndexedInputs, input => input.type);
        const decodedData = ethersInterface.events[event.name].parse(log.data);

        let failedToDecode = false;
        _.forEach(event.inputs, (param: Web3.EventParameter, idx: number) => {
            // Indexed parameters are stored in topics. Non-indexed ones in decodedData
            let value: BigNumber | string | number = param.indexed ? log.topics[topicsIndex++] : decodedData[idx];
            if (_.isUndefined(value)) {
                failedToDecode = true;
                return;
            }
            if (param.type === SolidityTypes.Address) {
                value = AbiDecoder._padZeros(new BigNumber(value).toString(16));
            } else if (param.type === SolidityTypes.Uint256 || param.type === SolidityTypes.Uint) {
                value = new BigNumber(value);
            } else if (param.type === SolidityTypes.Uint8) {
                value = new BigNumber(value).toNumber();
            }
            decodedParams[param.name] = value;
        });

        if (failedToDecode) {
            return log;
        } else {
            return {
                ...log,
                event: event.name,
                args: decodedParams,
            };
        }
    }
    private _addABI(abiArray: Web3.AbiDefinition[]): void {
        if (_.isUndefined(abiArray)) {
            return;
        }
        const ethersInterface = new ethersContracts.Interface(abiArray);
        _.map(abiArray, (abi: Web3.AbiDefinition) => {
            if (abi.type === AbiType.Event) {
                const topic = ethersInterface.events[abi.name].topic;
                this._methodIds[topic] = abi;
            }
        });
        this._savedABIs = this._savedABIs.concat(abiArray);
    }
}
