import { AbiDefinition, MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { AbiEncoder } from '.';
import { DeployedContractInfo, FunctionInfoBySelector, TransactionData, TransactionProperties } from './types';

export class TransactionDecoder {
    private readonly _functionInfoBySelector: FunctionInfoBySelector = {};

    private static _getFunctionSelector(calldata: string): string {
        const functionSelectorLength = 10;
        if (!calldata.startsWith('0x') || calldata.length < functionSelectorLength) {
            throw new Error(
                `Malformed calldata. Must include hex prefix '0x' and 4-byte function selector. Got '${calldata}'`,
            );
        }
        const functionSelector = calldata.substr(0, functionSelectorLength);
        return functionSelector;
    }

    public addABI(abiArray: AbiDefinition[], contractName: string, deploymentInfos?: DeployedContractInfo[]): void {
        const functionAbis: MethodAbi[] = _.filter(abiArray, abiEntry => {
            return abiEntry.type === 'function';
        });
        _.each(functionAbis, functionAbi => {
            const abiEncoder = new AbiEncoder.Method(functionAbi);
            const functionSelector = abiEncoder.getSelector();
            if (!(functionSelector in this._functionInfoBySelector)) {
                this._functionInfoBySelector[functionSelector] = [];
            }
            // Recored deployed versions of this decoder
            const functionSignature = abiEncoder.getSignature();
            _.each(deploymentInfos, deploymentInfo => {
                this._functionInfoBySelector[functionSelector].push({
                    functionSignature,
                    abiEncoder,
                    contractName,
                    contractAddress: deploymentInfo.contractAddress,
                    networkId: deploymentInfo.networkId,
                });
            });
            // If there isn't a deployed version of this contract, record it without address/network id
            if (_.isEmpty(deploymentInfos)) {
                this._functionInfoBySelector[functionSelector].push({
                    functionSignature,
                    abiEncoder,
                    contractName,
                });
            }
        });
    }

    public decode(calldata: string, txProperties_?: TransactionProperties): TransactionData {
        const functionSelector = TransactionDecoder._getFunctionSelector(calldata);
        const txProperties = _.isUndefined(txProperties_) ? {} : txProperties_;
        const candidateFunctionInfos = this._functionInfoBySelector[functionSelector];
        if (_.isUndefined(candidateFunctionInfos)) {
            throw new Error(`No functions registered for selector '${functionSelector}'`);
        }
        const functionInfo = _.find(candidateFunctionInfos, txDecoder => {
            return (
                (_.isUndefined(txProperties.contractName) ||
                    _.toLower(txDecoder.contractName) === _.toLower(txProperties.contractName)) &&
                (_.isUndefined(txProperties.contractAddress) ||
                    txDecoder.contractAddress === txProperties.contractAddress) &&
                (_.isUndefined(txProperties.networkId) || txDecoder.networkId === txProperties.networkId)
            );
        });
        if (_.isUndefined(functionInfo)) {
            throw new Error(`No function registered with properties: ${JSON.stringify(txProperties)}.`);
        } else if (_.isUndefined(functionInfo.abiEncoder)) {
            throw new Error(
                `Function ABI Encoder is not defined, for function with properties: ${JSON.stringify(txProperties)}.`,
            );
        }
        const functionName = functionInfo.abiEncoder.getDataItem().name;
        const functionSignature = functionInfo.abiEncoder.getSignatureType();
        const functionArguments = functionInfo.abiEncoder.decode(calldata);
        const decodedCalldata = {
            functionName,
            functionSignature,
            functionArguments,
        };
        return decodedCalldata;
    }
}
