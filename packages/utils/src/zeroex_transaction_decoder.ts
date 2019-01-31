import { getContractAddressesForNetworkOrThrow, NetworkId } from '@0x/contract-addresses';
import * as ContractArtifacts from '@0x/contract-artifacts';
import { SimpleContractArtifact } from '@0x/types';
import { AbiDefinition, ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { TransactionDecoder } from './transaction_decoder';
import { DeployedContractInfo, DeployedContractInfoByName, TransactionData, TransactionProperties } from './types';

export class ZeroExTransactionDecoder extends TransactionDecoder {
    private static _instance: ZeroExTransactionDecoder;

    public static addABI(
        abiArray: AbiDefinition[],
        contractName: string,
        deploymentInfos?: DeployedContractInfo[],
    ): void {
        const instance = ZeroExTransactionDecoder._getInstance();
        instance.addABI(abiArray, contractName, deploymentInfos);
    }

    public static decode(calldata: string, txProperties?: TransactionProperties): TransactionData {
        const instance = ZeroExTransactionDecoder._getInstance();
        const decodedCalldata = instance.decode(calldata, txProperties);
        return decodedCalldata;
    }

    private static _getInstance(): ZeroExTransactionDecoder {
        if (!ZeroExTransactionDecoder._instance) {
            ZeroExTransactionDecoder._instance = new ZeroExTransactionDecoder();
        }
        return ZeroExTransactionDecoder._instance;
    }

    private constructor() {
        super();
        // Load addresses by contract name
        const deployedContractInfoByName: DeployedContractInfoByName = {};
        _.each(NetworkId, (networkId: any) => {
            if (typeof networkId !== 'number') {
                return;
            }
            const contractAddressesForNetwork = getContractAddressesForNetworkOrThrow(networkId);
            _.each(contractAddressesForNetwork, (contractAddress: string, contractName: string) => {
                const contractNameLowercase = _.toLower(contractName);
                if (_.isUndefined(deployedContractInfoByName[contractNameLowercase])) {
                    deployedContractInfoByName[contractNameLowercase] = [];
                }
                deployedContractInfoByName[contractNameLowercase].push({
                    contractAddress,
                    networkId,
                });
            });
        });
        // Load contract artifacts
        _.each(ContractArtifacts, (contractArtifactAsJson: any) => {
            const conractArtifact = contractArtifactAsJson as SimpleContractArtifact;
            const contractName = conractArtifact.contractName;
            const contractNameLowercase = _.toLower(contractName);
            const contractAbi: ContractAbi = conractArtifact.compilerOutput.abi;
            this.addABI(contractAbi, contractName, deployedContractInfoByName[contractNameLowercase]);
        });
    }
}
