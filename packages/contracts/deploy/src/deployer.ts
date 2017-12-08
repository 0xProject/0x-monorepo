import {TxData} from '@0xproject/types';
import {promisify} from '@0xproject/utils';
import {Web3Wrapper} from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import {Contract} from './utils/contract';
import {encoder} from './utils/encoder';
import {fsWrapper} from './utils/fs_wrapper';
import {
    ContractArtifact,
    ContractData,
    DeployerOptions,
} from './utils/types';
import {utils} from './utils/utils';

// Gas added to gas estimate to make sure there is sufficient gas for deployment.
const EXTRA_GAS = 200000;

export class Deployer {
    public web3Wrapper: Web3Wrapper;
    private artifactsDir: string;
    private jsonrpcPort: number;
    private networkId: number;
    private defaults: Partial<TxData>;

    constructor(opts: DeployerOptions) {
        this.artifactsDir = opts.artifactsDir;
        this.jsonrpcPort = opts.jsonrpcPort;
        this.networkId = opts.networkId;
        const jsonrpcUrl = `http://localhost:${this.jsonrpcPort}`;
        const web3Provider = new Web3.providers.HttpProvider(jsonrpcUrl);
        this.defaults = opts.defaults;
        this.web3Wrapper = new Web3Wrapper(web3Provider, this.defaults);
    }
    /**
     * Loads contract artifact and deploys contract with given arguments.
     * @param contractName Name of the contract to deploy. Must match name of an artifact in artifacts directory.
     * @param args Array of contract constructor arguments.
     * @return Deployed contract instance.
     */
    public async deployAsync(contractName: string, args: any[] = []): Promise<Web3.ContractInstance> {
        const contractArtifact: ContractArtifact = this.loadContractArtifactIfExists(contractName);
        const contractData: ContractData = this.getContractDataFromArtifactIfExists(contractArtifact);
        const data = contractData.unlinked_binary;
        const from = await this.getFromAddressAsync();
        const gas = await this.getAllowableGasEstimateAsync(data);
        const txData = {
            gasPrice: this.defaults.gasPrice,
            from,
            data,
            gas,
        };
        const abi = contractData.abi;
        const web3ContractInstance = await this.deployFromAbiAsync(abi, args, txData);
        utils.consoleLog(`${contractName}.sol successfully deployed at ${web3ContractInstance.address}`);
        const contractInstance = new Contract(web3ContractInstance, this.defaults);
        return contractInstance;
    }
    /**
     * Loads contract artifact, deploys with given arguments, and saves updated data to artifact.
     * @param contractName Name of the contract to deploy. Must match name of an artifact in artifacts directory.
     * @param args Array of contract constructor arguments.
     * @return Deployed contract instance.
     */
    public async deployAndSaveAsync(contractName: string, args: any[] = []): Promise<Web3.ContractInstance> {
        const contractInstance = await this.deployAsync(contractName, args);
        await this.saveContractDataToArtifactAsync(contractName, contractInstance.address, args);
        return contractInstance;
    }
    /**
     * Deploys a contract given its ABI, arguments, and transaction data.
     * @param abi ABI of contract to deploy.
     * @param args Constructor arguments to use in deployment.
     * @param txData Tx options used for deployment.
     * @return Promise that resolves to a web3 contract instance.
     */
    private async deployFromAbiAsync(abi: Web3.ContractAbi, args: any[], txData: Web3.TxData): Promise<any> {
        const contract: Web3.Contract<Web3.ContractInstance> = this.web3Wrapper.getContractFromAbi(abi);
        const deployPromise = new Promise((resolve, reject) => {
            /**
             * Contract is inferred as 'any' because TypeScript
             * is not able to read 'new' from the Contract interface
             */
            (contract as any).new(...args, txData, (err: Error, res: any): any => {
                if (err) {
                    reject(err);
                } else if (_.isUndefined(res.address) && !_.isUndefined(res.transactionHash)) {
                    utils.consoleLog(`transactionHash: ${res.transactionHash}`);
                } else {
                    resolve(res);
                }
            });
        });
        return deployPromise;
    }
    /**
     * Updates a contract artifact's address and encoded constructor arguments.
     * @param contractName Name of contract. Must match an existing artifact.
     * @param contractAddress Contract address to save to artifact.
     * @param args Contract constructor arguments that will be encoded and saved to artifact.
     */
    private async saveContractDataToArtifactAsync(contractName: string,
                                                  contractAddress: string, args: any[]): Promise<void> {
        const contractArtifact: ContractArtifact = this.loadContractArtifactIfExists(contractName);
        const contractData: ContractData = this.getContractDataFromArtifactIfExists(contractArtifact);
        const abi = contractData.abi;
        const encodedConstructorArgs = encoder.encodeConstructorArgsFromAbi(args, abi);
        const newContractData = {
            ...contractData,
            address: contractAddress,
            constructor_args: encodedConstructorArgs,
        };
        const newArtifact = {
            ...contractArtifact,
            networks: {
                ...contractArtifact.networks,
                [this.networkId]: newContractData,
            },
        };
        const artifactString = utils.stringifyWithFormatting(newArtifact);
        const artifactPath = `${this.artifactsDir}/${contractName}.json`;
        await fsWrapper.writeFileAsync(artifactPath, artifactString);
    }
    /**
     * Loads a contract artifact, if it exists.
     * @param contractName Name of the contract, without the extension.
     * @return The contract artifact.
     */
    private loadContractArtifactIfExists(contractName: string): ContractArtifact {
        const artifactPath = `${this.artifactsDir}/${contractName}.json`;
        try {
            const contractArtifact: ContractArtifact = require(artifactPath);
            return contractArtifact;
        } catch (err) {
            throw new Error(`Artifact not found for contract: ${contractName}`);
        }
    }
    /**
     * Gets data for current networkId stored in artifact.
     * @param contractArtifact The contract artifact.
     * @return Network specific contract data.
     */
    private getContractDataFromArtifactIfExists(contractArtifact: ContractArtifact): ContractData {
        const contractData = contractArtifact.networks[this.networkId];
        if (_.isUndefined(contractData)) {
            throw new Error(`Data not found in artifact for contract: ${contractArtifact.contract_name}`);
        }
        return contractData;
    }
    /**
     * Gets the address to use for sending a transaction.
     * @return The default from address. If not specified, returns the first address accessible by web3.
     */
    private async getFromAddressAsync(): Promise<string> {
        let from: string;
        if (_.isUndefined(this.defaults.from)) {
            const accounts = await this.web3Wrapper.getAvailableAddressesAsync();
            from = accounts[0];
        } else {
            from = this.defaults.from;
        }
        return from;
    }
    /**
     * Estimates the gas required for a transaction.
     * If gas would be over the block gas limit, the max allowable gas is returned instead.
     * @param data Bytecode to estimate gas for.
     * @return Gas estimate for transaction data.
     */
    private async getAllowableGasEstimateAsync(data: string): Promise<number> {
        const block = await this.web3Wrapper.getBlockAsync('latest');
        let gas: number;
        try {
            const gasEstimate: number = await this.web3Wrapper.estimateGasAsync(data);
            gas = Math.min(gasEstimate + EXTRA_GAS, block.gasLimit);
        } catch (err) {
            gas = block.gasLimit;
        }
        return gas;
    }
}
