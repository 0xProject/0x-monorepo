import { TransactionDecoder } from './transaction_decoder';
import { getContractAddressesForNetworkOrThrow, NetworkId } from '@0x/contract-addresses';
import * as ContractArtifacts from '@0x/contract-artifacts';
import { SimpleContractArtifact } from '@0x/types';
import { AbiDefinition, ContractAbi } from 'ethereum-types';
import { TransactionData, DeployedContractInfo, DeployedContractInfoByName, TransactionProperties } from './types';
import * as _ from 'lodash';

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

    public static decode(calldata: string, txProperties?: TransactionProperties): TransactionData {   
        const instance = ZeroExTransactionDecoder.getInstance();
        const decodedCalldata = instance.decode(calldata, txProperties);
        return decodedCalldata;
    }
}