import * as Web3 from 'web3';
import * as _ from 'lodash';
import {AbiType, DecodedLogArgs, DecodedArgs} from '../types';
import * as SolidityCoder from 'web3/lib/solidity/coder';

export class AbiDecoder {
    private savedABIs: Web3.AbiDefinition[] = [];
    private methodIDs: {[signatureHash: string]: Web3.EventAbi} = {};
    constructor(abiArrays: Web3.AbiDefinition[][]) {
        _.map(abiArrays, this.addABI.bind(this));
    }
    public decodeLog(logItem: Web3.LogEntry): DecodedArgs|undefined {
        const methodID = logItem.topics[0];
        const event = this.methodIDs[methodID];
        if (!_.isUndefined(event)) {
            const logData = logItem.data;
            const decodedParams: DecodedLogArgs = {};
            let dataIndex = 0;
            let topicsIndex = 1;

            const nonIndexedInputs = _.filter(event.inputs, input => !input.indexed);
            const dataTypes = _.map(nonIndexedInputs, input => input.type);
            const decodedData = SolidityCoder.decodeParams(dataTypes, logData.slice(2));
            _.map(event.inputs, (param: Web3.EventParameter) => {
                let value;
                if (param.indexed) {
                    value = logItem.topics[topicsIndex];
                    topicsIndex++;
                } else {
                    value = decodedData[dataIndex];
                    dataIndex++;
                }
                if (param.type === 'address') {
                    value = this.padZeros(new Web3().toBigNumber(value).toString(16));
                } else if (param.type === 'uint256' || param.type === 'uint8' || param.type === 'int' ) {
                    value = new Web3().toBigNumber(value).toString(10);
                }
                decodedParams[param.name] = value;
            });

            return {
                event: event.name,
                args: decodedParams,
            };
        }
    }
    private addABI(abiArray: Web3.AbiDefinition[]): void {
        _.map(abiArray, (abi: Web3.AbiDefinition) => {
            if (abi.type === AbiType.Event) {
                const signature = `${abi.name}(${_.map(abi.inputs, input => input.type).join(',')})`;
                const signatureHash = new Web3().sha3(signature);
                this.methodIDs[signatureHash] = abi;
            }
        });
        this.savedABIs = this.savedABIs.concat(abiArray);
    }
    private padZeros(address: string) {
      let formatted = address;
      if (formatted.indexOf('0x') !== -1) {
        formatted = formatted.slice(2);
      }

      formatted = _.padStart(formatted, 40, '0');
      return '0x' + formatted;
    }
}
