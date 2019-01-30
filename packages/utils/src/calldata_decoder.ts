// Decodes any 0x transaction

import * as ContractArtifacts from '@0x/contract-artifacts';
import { SimpleContractArtifact } from '@0x/types';
import { ContractAbi, MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';
import { AbiEncoder } from '.';
import { ContractAddresses, getContractAddressesForNetworkOrThrow, NetworkId } from '@0x/contract-addresses';

export interface DecodedCalldata {
    functionName: string;
    functionSignature: string;
    functionArguments: any;
}

interface AbiEncoderBySelectorElement {
    abiEncoder: AbiEncoder.Method;
    contractName?: string;
    contractAddress?: string;
    networkId?: number;
}

interface TransactionDecoderInfo {
    abiEncoder: AbiEncoder.Method;
    contractName?: string;
    contractAddress?: string;
    networkId?: number;
}

interface TransactionProperties {
    contractName?: string;
    contractAddress?: string;
    networkId?: number;
}

interface AbiEncoderByNeworkId {
    [index: string]: AbiEncoderBySelectorElement;
}

interface AbiEncoderBySelector {
    [index: string]: AbiEncoderByNeworkId;
}

interface DeployedContractInfo {
    contractAddress?: string;
    networkId?: number;
}

interface DeployedContractInfoByName {
    [index: string]: DeployedContractInfo[];
}

interface TransactionDecodersBySelector {
    [index: string]: TransactionDecoderInfo[];
}

export class CalldataDecoder {
    private readonly _deployedContractInfoByName = {} as DeployedContractInfoByName;
    private readonly _abiEncoderBySelector: AbiEncoderBySelector = {};
    private readonly _txDecoders: TransactionDecodersBySelector = {};
    private static _instance: CalldataDecoder;

    public static getInstance(): CalldataDecoder {
        if (!CalldataDecoder._instance) {
            CalldataDecoder._instance = new CalldataDecoder();
        }
        return CalldataDecoder._instance;
    }

    private constructor() {
        // Load addresses by contract name
        _.each(NetworkId, (networkId: any) => {
            if (typeof networkId !== 'number') return;
            const networkIdAsNumber = networkId as number;
            const contractAddressesForNetwork = getContractAddressesForNetworkOrThrow(networkIdAsNumber);
            _.each(contractAddressesForNetwork, (contractAddress: string, contractName: string) => {
                const contractNameLowercase = _.toLower(contractName);
                if (_.isUndefined(this._deployedContractInfoByName[contractNameLowercase])) {
                    this._deployedContractInfoByName[contractNameLowercase] = [];
                }
                this._deployedContractInfoByName[contractNameLowercase].push({contractAddress, networkId: networkIdAsNumber});
            });
        });
        // Load contract artifacts
        _.each(ContractArtifacts, (contractArtifactAsJson: any) => {
            const conractArtifact = contractArtifactAsJson as SimpleContractArtifact;
            const contractName = conractArtifact.contractName;
            const contractNameLowercase = _.toLower(contractName);
            const contractAbi: ContractAbi = conractArtifact.compilerOutput.abi;
            const functionAbis = _.filter(contractAbi, (abiEntry) => {return abiEntry.type === 'function'}) as MethodAbi[];
            _.each(functionAbis, (functionAbi) => {
                const abiEncoder = new AbiEncoder.Method(functionAbi);
                const functionSelector = abiEncoder.getSelector();
                if (_.has(this._abiEncoderBySelector, functionSelector)) {
                    return;
                }
                if (!(functionSelector in this._txDecoders)) this._txDecoders[functionSelector] = [];
                // Recored deployed versions of this decoder
                _.each(this._deployedContractInfoByName[contractNameLowercase], (deployedContract) => {
                    this._txDecoders[functionSelector].push({
                        abiEncoder,
                        contractName,
                        contractAddress: deployedContract.contractAddress,
                        networkId: deployedContract.networkId,
                    });
                });
                // If there isn't a deployed version of this contract, record it without address/network id
                if (_.isUndefined(this._deployedContractInfoByName[contractNameLowercase])) {
                    this._txDecoders[functionSelector].push({
                        abiEncoder,
                        contractName,
                    });
                }
            });
        });
    }

    private static getFunctionSelector(calldata: string): string {
        if (!calldata.startsWith('0x') || calldata.length < 10) {
            throw new Error(`Malformed calldata. Must include hex prefix '0x' and 4-byte function selector. Got '${calldata}'`);
        }
        const functionSelector = calldata.substr(0, 10);
        return functionSelector;
    }

    public static decode(calldata: string, txProperties_?: TransactionProperties): DecodedCalldata {
        const functionSelector = CalldataDecoder.getFunctionSelector(calldata);
        const txProperties = _.isUndefined(txProperties_) ? {} : txProperties_;
        const instance = CalldataDecoder.getInstance();
        const txDecodersByFunctionSelector = instance._txDecoders[functionSelector];
        if (_.isUndefined(txDecodersByFunctionSelector)) {
            throw new Error(`No decoder registered for function selector '${functionSelector}'`);
        }
        const txDecoderWithProperties = _.find(txDecodersByFunctionSelector, (txDecoder) => {
            return  (_.isUndefined(txProperties.contractName) || _.toLower(txDecoder.contractName) === _.toLower(txProperties.contractName)) &&
                    (_.isUndefined(txProperties.contractAddress) || txDecoder.contractAddress === txProperties.contractAddress) &&
                    (_.isUndefined(txProperties.networkId) || txDecoder.networkId === txProperties.networkId);
        });
        if (_.isUndefined(txDecoderWithProperties)) {
            throw new Error(`No decoder registered with properties: ${JSON.stringify(txProperties)}.`);
        }
        const functionName = txDecoderWithProperties.abiEncoder.getDataItem().name;
        const functionSignature = txDecoderWithProperties.abiEncoder.getSignatureType();
        const functionArguments = txDecoderWithProperties.abiEncoder.decode(calldata);
        const decodedCalldata = {
            functionName,
            functionSignature,
            functionArguments
        }
        return decodedCalldata;
    }
}