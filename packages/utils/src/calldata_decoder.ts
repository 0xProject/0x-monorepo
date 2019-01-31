// Decodes any 0x transaction

import * as ContractArtifacts from '@0x/contract-artifacts';
import { SimpleContractArtifact } from '@0x/types';
import { AbiDefinition, ContractAbi, MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';
import { AbiEncoder } from '.';
import { getContractAddressesForNetworkOrThrow, NetworkId } from '@0x/contract-addresses';

export interface FunctionInfo {
    functionSignature: string;
    contractName?: string;
    contractAddress?: string;
    networkId?: number;
    abiEncoder?: AbiEncoder.Method;
}

interface FunctionInfoBySelector {
    [index: string]: FunctionInfo[];
}

export interface DecodedCalldata {
    functionName: string;
    functionSignature: string;
    functionArguments: any;
}

interface TransactionProperties {
    contractName?: string;
    contractAddress?: string;
    networkId?: number;
}

interface DeployedContractInfo {
    contractAddress: string;
    networkId: number;
}

interface DeployedContractInfoByName {
    [index: string]: DeployedContractInfo[];
}

export class TransactionDecoder {
    private _functionInfoBySelector: FunctionInfoBySelector = {};
    
    private static getFunctionSelector(calldata: string): string {
        if (!calldata.startsWith('0x') || calldata.length < 10) {
            throw new Error(`Malformed calldata. Must include hex prefix '0x' and 4-byte function selector. Got '${calldata}'`);
        }
        const functionSelector = calldata.substr(0, 10);
        return functionSelector;
    }

    public addABI(abiArray: AbiDefinition[], contractName: string, deploymentInfos?: DeployedContractInfo[]): void {
        if (_.isEmpty(abiArray)) {
            return;
        }
        const functionAbis = _.filter(abiArray, abiEntry => {
            return abiEntry.type === 'function';
        }) as MethodAbi[];
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

    public decode(calldata: string, txProperties_?: TransactionProperties): DecodedCalldata {
        const functionSelector = TransactionDecoder.getFunctionSelector(calldata);
        const txProperties = _.isUndefined(txProperties_) ? {} : txProperties_;
        
        const candidateFunctionInfos = this._functionInfoBySelector[functionSelector];
        if (_.isUndefined(candidateFunctionInfos)) {
            throw new Error(`No functions registered for selector '${functionSelector}'`);
        }
        const functionInfo = _.find(candidateFunctionInfos, (txDecoder) => {
            return  (_.isUndefined(txProperties.contractName) || _.toLower(txDecoder.contractName) === _.toLower(txProperties.contractName)) &&
                    (_.isUndefined(txProperties.contractAddress) || txDecoder.contractAddress === txProperties.contractAddress) &&
                    (_.isUndefined(txProperties.networkId) || txDecoder.networkId === txProperties.networkId);
        });
        if (_.isUndefined(functionInfo)) {
            throw new Error(`No function registered with properties: ${JSON.stringify(txProperties)}.`);
        } else if (_.isUndefined(functionInfo.abiEncoder)) {
            throw new Error(`Function ABI Encoder is not defined, for function with properties: ${JSON.stringify(txProperties)}.`);
        }
        const functionName = functionInfo.abiEncoder.getDataItem().name;
        const functionSignature = functionInfo.abiEncoder.getSignatureType();
        const functionArguments = functionInfo.abiEncoder.decode(calldata);
        const decodedCalldata = {
            functionName,
            functionSignature,
            functionArguments
        }
        return decodedCalldata;
    }
}

export class ZeroExTransactionDecoder extends TransactionDecoder {
    private readonly _deployedContractInfoByName = {} as DeployedContractInfoByName;
    private static _instance: ZeroExTransactionDecoder;

    private static getInstance(): ZeroExTransactionDecoder {
        if (!ZeroExTransactionDecoder._instance) {
            ZeroExTransactionDecoder._instance = new ZeroExTransactionDecoder();
        }
        return ZeroExTransactionDecoder._instance;
    }

    private constructor() {
        super();
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
             this.addABI(contractAbi, contractName, this._deployedContractInfoByName[contractNameLowercase]);
        });
    }

    public static addABI(abiArray: AbiDefinition[], contractName: string, deploymentInfos?: DeployedContractInfo[]): void {
        const instance = ZeroExTransactionDecoder.getInstance();
        instance.addABI(abiArray, contractName, deploymentInfos);
    }

    public static decode(calldata: string, txProperties?: TransactionProperties): DecodedCalldata {   
        const instance = ZeroExTransactionDecoder.getInstance();
        const decodedCalldata = instance.decode(calldata, txProperties);
        return decodedCalldata;
    }
}
