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
    contractName: string;
    deployedAddress?: string;
    deployedNeworkId?: string;
}

interface AbiEncoderBySelectorElement {
    abiEncoder: AbiEncoder.Method;
    contractName?: string;
    contractAddress?: string;
}

interface AbiEncoderByNeworkId {
    [index: string]: AbiEncoderBySelectorElement;
}

interface AbiEncoderBySelector {
    [index: string]: AbiEncoderByNeworkId;
}

interface DeployedContractInfoByNetwork {
    [index: number]: string;
}

interface DeployedContractInfoByName {
    [index: string]: DeployedContractInfoByNetwork;
}

export class CalldataDecoder {
    private readonly _deployedContractInfoByName = {} as DeployedContractInfoByName;
    private readonly _abiEncoderBySelector: AbiEncoderBySelector = {};
    private static _instance: CalldataDecoder;

    public static getInstance(): CalldataDecoder {
        if (!CalldataDecoder._instance) {
            CalldataDecoder._instance = new CalldataDecoder();
        }
        return CalldataDecoder._instance;
    }

    private constructor() {
        // Load addresses by contract name
        _.each(NetworkId, (networkId: NetworkId) => {
            const contractAddressesForNetwork = getContractAddressesForNetworkOrThrow(networkId);
            _.each(contractAddressesForNetwork, (contractAddress: string, contractName: string) => {
                this._deployedContractInfoByName[contractName][networkId as number] = contractAddress;
            });
        });
        // Load contract artifacts
        _.each(ContractArtifacts, (contractArtifactAsJson: any) => {
            const conractArtifact = contractArtifactAsJson as SimpleContractArtifact;
            const contractAbi: ContractAbi = conractArtifact.compilerOutput.abi;
            const functionAbis = _.filter(contractAbi, (abiEntry) => {return abiEntry.type === 'function'}) as MethodAbi[];
            _.each(functionAbis, (functionAbi) => {
                const abiEncoder = new AbiEncoder.Method(functionAbi);
                const functionSelector = abiEncoder.getSelector();
                if (_.has(this._abiEncoderBySelector, functionSelector)) {
                    return;
                }
                this._abiEncoderBySelector[functionSelector][conractArtifact.contractName] = {abiEncoder};
            });
        });
    }

    public static registerContractAbi(contractArtifact: SimpleContractArtifact, deployedAddress?: string, deployedNeworkId?: number) {

    }

    private static getFunctionSelector(calldata: string): string {
        if (!calldata.startsWith('0x') || calldata.length < 10) {
            throw new Error(`Malformed calldata. Must include hex prefix '0x' and 4-byte function selector. Got '${calldata}'`);
        }
        const functionSelector = calldata.substr(0, 10);
        return functionSelector;
    }

    public static decodeWithContractAddress(calldata: string, contractAddress: string, networkId?: number): DecodedCalldata {
        const functionSelector = CalldataDecoder.getFunctionSelector(calldata);
        const instance = CalldataDecoder.getInstance();
        const contractName = _.findKey(instance._deployedContractInfoByName, (info: DeployedContractInfoByNetwork) => {
            return (!_.isUndefined(networkId) && info[networkId] === contractAddress) || (_.isUndefined(networkId) && contractAddress in info);
        });
        if (_.isUndefined(contractName)) {
            throw new Error(`Could not find contract name: ${contractName}`);
        }
        const abiEncoder = instance._abiEncoderBySelector[functionSelector][contractName];
        if (_.isUndefined(abiEncoder)) {
            throw new Error(`Could not find matching abi encoder for selector '${functionSelector}'`);
        }
        
    }

    public static decodeWithContractName(calldata: string, contractName: string): DecodedCalldata {
        const functionSelector = CalldataDecoder.getFunctionSelector(calldata);
        const instance = CalldataDecoder.getInstance();
        const abiEncoder = instance._abiEncoderBySelector[functionSelector][contractName];
        if (_.isUndefined(abiEncoder)) {
            throw new Error(`Could not find matching abi encoder for selector '${functionSelector}'`);
        }
    }

    public static decodeWithoutContractInfo(calldata: string): DecodedCalldata {
        const functionSelector = CalldataDecoder.getFunctionSelector(calldata);
        const instance = CalldataDecoder.getInstance();
        const abiEncoder = _.find(instance._abiEncoderBySelector[functionSelector], () => {return true});
        if (_.isUndefined(abiEncoder)) {
            throw new Error(`Could not find matching abi encoder for selector '${functionSelector}'`);
        }
        return {
            functionName: string;
            functionSignature: string;
            functionArguments: any;
            contractName: string;
            deployedAddress?: string;
            deployedNeworkId?: string;
        };
    }

    public static decode(calldata: string, contractName?: string, contractAddress?: string, networkId?: number, rules?: AbiEncoder.DecodingRules): DecodedCalldata {
        

        

        /*
        const functionName = abiEncoder.getDataItem().name;
        const functionSignature = abiEncoder.getSignatureType();
        const functionArguments = abiEncoder.decode(calldata, rules);
        const decodedCalldata = {
            functionName,
            functionSignature,
            functionArguments
        }
        return decodedCalldata;*/
    }
}