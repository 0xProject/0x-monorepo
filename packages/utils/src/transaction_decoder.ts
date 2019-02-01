import { AbiDefinition, MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { AbiEncoder } from '.';
import { DeployedContractInfo, FunctionInfoBySelector, TransactionData, TransactionProperties } from './types';

export class TransactionDecoder {
    private readonly _functionInfoBySelector: FunctionInfoBySelector = {};
    /**
     * Retrieves the function selector from tranasction data.
     * @param txData hex-encoded transaction data.
     * @return hex-encoded function selector.
     */
    private static _getFunctionSelector(txData: string): string {
        const functionSelectorLength = 10;
        if (!txData.startsWith('0x') || txData.length < functionSelectorLength) {
            throw new Error(
                `Malformed transaction data. Must include a hex prefix '0x' and 4-byte function selector. Got '${txData}'`,
            );
        }
        const functionSelector = txData.substr(0, functionSelectorLength);
        return functionSelector;
    }
    /**
     * Adds a set of ABI definitions, after which transaction data targeting these ABI's can be decoded.
     * Additional properties can be included to disambiguate similar ABI's. For example, if two functions
     * have the same signature but different parameter names, then their ABI definitions can be disambiguated
     * by specifying a contract name.
     * @param abiDefinitions ABI definitions for a given contract.
     * @param contractName Name of contract that encapsulates the ABI definitions (optional).
     * @param deploymentInfos A collection of network/address pairs where this contract is deployed (optional).
     */
    public addABI(abiDefinitions: AbiDefinition[], contractName?: string, deploymentInfos?: DeployedContractInfo[]): void {
        // Disregard definitions that are not functions
        const functionAbis = _.filter(abiDefinitions, abiEntry => {
            return abiEntry.type === 'function';
        }) as MethodAbi[];
        // Record function ABI's
        _.each(functionAbis, functionAbi => {
            const abiEncoder = new AbiEncoder.Method(functionAbi);
            const functionSelector = abiEncoder.getSelector();
            if (!(functionSelector in this._functionInfoBySelector)) {
                this._functionInfoBySelector[functionSelector] = [];
            }
            // Recored a copy of this ABI for each deployment
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
            // There is no deployment info for this contract; record it without an address/network id
            if (_.isEmpty(deploymentInfos)) {
                this._functionInfoBySelector[functionSelector].push({
                    functionSignature,
                    abiEncoder,
                    contractName,
                });
            }
        });
    }
    /**
     * Decodes transaction data for a known ABI.
     * @param txData hex-encoded transaction data.
     * @param txProperties Properties about the transaction used to disambiguate similar ABI's (optional).
     * @return Decoded transaction data. Includes: function name and signature, along with the decoded arguments.
     */
    public decode(txData: string, txProperties_?: TransactionProperties): TransactionData {
        // Lookup 
        const functionSelector = TransactionDecoder._getFunctionSelector(txData);
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
        const functionArguments = functionInfo.abiEncoder.decode(txData);
        const decodedCalldata = {
            functionName,
            functionSignature,
            functionArguments,
        };
        return decodedCalldata;
    }
}
