import * as Web3 from 'web3';
import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import {AbiType, DecodedLogArgs, DecodedArgs, LogWithDecodedArgs, RawLog} from '../types';
import * as SolidityCoder from 'web3/lib/solidity/coder';

export class AbiDecoder {
    private savedABIs: Web3.AbiDefinition[] = [];
    private methodIds: {[signatureHash: string]: Web3.EventAbi} = {};
    constructor(abiArrays: Web3.AbiDefinition[][]) {
        _.map(abiArrays, this.addABI.bind(this));
    }
    public tryToDecodeLogOrNoOp(log: Web3.LogEntry): LogWithDecodedArgs|RawLog {
        const methodId = log.topics[0];
        const event = this.methodIds[methodId];
        if (_.isUndefined(event)) {
            return log;
        }
        const logData = log.data;
        const decodedParams: DecodedLogArgs = {};
        let dataIndex = 0;
        let topicsIndex = 1;

        const nonIndexedInputs = _.filter(event.inputs, input => !input.indexed);
        const dataTypes = _.map(nonIndexedInputs, input => input.type);
        const decodedData = SolidityCoder.decodeParams(dataTypes, logData.slice(2));

        _.map(event.inputs, (param: Web3.EventParameter) => {
            let value;
            if (param.indexed) {
                value = log.topics[topicsIndex];
                topicsIndex++;
            } else {
                value = decodedData[dataIndex];
                dataIndex++;
            }
            if (param.type === 'address') {
                value = this.padZeros(new BigNumber(value).toString(16));
            } else if (param.type === 'uint256' || param.type === 'uint8' || param.type === 'int' ) {
                value = new BigNumber(value);
            }
            decodedParams[param.name] = value;
        });

        return {
            ...log,
            event: event.name,
            args: decodedParams,
        };
    }
    private addABI(abiArray: Web3.AbiDefinition[]): void {
        _.map(abiArray, (abi: Web3.AbiDefinition) => {
            if (abi.type === AbiType.Event) {
                const signature = `${abi.name}(${_.map(abi.inputs, input => input.type).join(',')})`;
                const signatureHash = new Web3().sha3(signature);
                this.methodIds[signatureHash] = abi;
            }
        });
        this.savedABIs = this.savedABIs.concat(abiArray);
    }
    private padZeros(address: string) {
        let formatted = address;
        if (_.startsWith(formatted, '0x')) {
            formatted = formatted.slice(2);
        }

        formatted = _.padStart(formatted, 40, '0');
        return `0x${formatted}`;
    }
}
