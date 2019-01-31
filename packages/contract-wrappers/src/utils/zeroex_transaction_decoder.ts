import { getContractAddressesForNetworkOrThrow, NetworkId } from '@0x/contract-addresses';
import * as ContractArtifacts from '@0x/contract-artifacts';
import { SimpleContractArtifact } from '@0x/types';
import { AbiDefinition, ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { DeployedContractInfo, DeployedContractInfoByName, TransactionData, TransactionDecoder, TransactionProperties } from '@0x/utils';

export class ZeroExTransactionDecoder extends TransactionDecoder {
    private static _instance: ZeroExTransactionDecoder;
    /**
     * Adds a set of ABI definitions, after which transaction data targeting these ABI's can be decoded.
     * Additional properties can be included to disambiguate similar ABI's. For example, if two functions
     * have the same signature but different parameter names, then their ABI definitions can be disambiguated
     * by specifying a contract name.
     * @param abiDefinitions ABI definitions for a given contract.
     * @param contractName Name of contract that encapsulates the ABI definitions (optional).
     * @param deploymentInfos A collection of network/address pairs where this contract is deployed (optional).
     */
    public static addABI(
        abiDefinitions: AbiDefinition[],
        contractName: string,
        deploymentInfos?: DeployedContractInfo[],
    ): void {
        const instance = ZeroExTransactionDecoder._getInstance();
        instance.addABI(abiDefinitions, contractName, deploymentInfos);
    }
    /**
     * Decodes transaction data for a known ABI.
     * @param txData hex-encoded transaction data.
     * @param txProperties Properties about the transaction used to disambiguate similar ABI's (optional).
     * @return Decoded transaction data. Includes: function name and signature, along with the decoded arguments.
     */
    public static decode(calldata: string, txProperties?: TransactionProperties): TransactionData {
        const instance = ZeroExTransactionDecoder._getInstance();
        const decodedCalldata = instance.decode(calldata, txProperties);
        return decodedCalldata;
    }
    /**
     * Gets instance for singleton.
     * @return singleton instance.
     */
    private static _getInstance(): ZeroExTransactionDecoder {
        if (!ZeroExTransactionDecoder._instance) {
            ZeroExTransactionDecoder._instance = new ZeroExTransactionDecoder();
        }
        return ZeroExTransactionDecoder._instance;
    }
    /**
     * Adds all known contract ABI's defined by the @0x/Artifacts package, along with known 0x
     * contract addresses.
     */
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
