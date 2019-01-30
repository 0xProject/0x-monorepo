// Decodes any 0x transaction

import * as ContractArtifacts from '@0x/contract-artifacts';
import { SimpleContractArtifact } from '@0x/types';
import { ContractAbi, MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';
import { AbiEncoder } from '.';

export interface DecodedCalldata {
    functionName: string;
    functionSignature: string;
    functionArguments: any;
}

interface AbiEncoderBySelector {
    [index: string]: AbiEncoder.Method;
}

export class CalldataDecoder {
    private readonly _abiEncoderBySelector: AbiEncoderBySelector = {};
    private static _instance: CalldataDecoder;

    public static getInstance(): CalldataDecoder {
        if (!CalldataDecoder._instance) {
            CalldataDecoder._instance = new CalldataDecoder();
        }
        return CalldataDecoder._instance;
    }

    public constructor() {
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
                this._abiEncoderBySelector[functionSelector] = abiEncoder;
            });
        });
    }

    public static decode(calldata: string, rules?: AbiEncoder.DecodingRules): DecodedCalldata {
        if (!calldata.startsWith('0x') || calldata.length < 10) {
            throw new Error(`Malformed calldata. Must include hex prefix '0x' and 4-byte function selector. Got '${calldata}'`);
        }
        const functionSelector = calldata.substr(0, 10);
        const instance = CalldataDecoder.getInstance();
        const abiEncoder = instance._abiEncoderBySelector[functionSelector];
        if (_.isUndefined(abiEncoder)) {
            throw new Error(`Could not find matching abi encoder for selector '${functionSelector}'`);
        }
        const functionName = abiEncoder.getDataItem().name;
        const functionSignature = abiEncoder.getSignatureType();
        const functionArguments = abiEncoder.decode(calldata, rules);
        const decodedCalldata = {
            functionName,
            functionSignature,
            functionArguments
        }
        return decodedCalldata;
    }
}