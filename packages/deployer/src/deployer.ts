import { AbiType, ConstructorAbi, ContractAbi, Provider, TxData } from '@0xproject/types';
import { logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as solc from 'solc';
import * as Web3 from 'web3';

import { Contract } from './utils/contract';
import { encoder } from './utils/encoder';
import { fsWrapper } from './utils/fs_wrapper';
import {
    ContractArtifact,
    ContractNetworkData,
    DeployerOptions,
    ProviderDeployerOptions,
    UrlDeployerOptions,
} from './utils/types';
import { utils } from './utils/utils';

// Gas added to gas estimate to make sure there is sufficient gas for deployment.
const EXTRA_GAS = 200000;

/**
 * The Deployer facilitates deploying Solidity smart contracts to the blockchain.
 * It can be used to build custom migration scripts.
 */
export class Deployer {
    public web3Wrapper: Web3Wrapper;
    private _artifactsDir: string;
    private _networkId: number;
    private _defaults: Partial<TxData>;
    /**
     * Gets data for current version stored in artifact.
     * @param contractArtifact The contract artifact.
     * @return Version specific contract data.
     */
    private static _getContractCompilerOutputFromArtifactIfExists(
        contractArtifact: ContractArtifact,
    ): solc.StandardContractOutput {
        const compilerOutputIfExists = contractArtifact.compilerOutput;
        if (_.isUndefined(compilerOutputIfExists)) {
            throw new Error(`Compiler output not found in artifact for contract: ${contractArtifact.contractName}`);
        }
        return compilerOutputIfExists;
    }
    /**
     * Instantiate a new instance of the Deployer class.
     * @param opts Deployer options, including either an RPC url or Provider instance.
     * @returns A Deployer instance
     */
    constructor(opts: DeployerOptions) {
        this._artifactsDir = opts.artifactsDir;
        this._networkId = opts.networkId;
        this._defaults = opts.defaults;
        let provider: Provider;
        if (_.isUndefined((opts as ProviderDeployerOptions).provider)) {
            const jsonrpcUrl = (opts as UrlDeployerOptions).jsonrpcUrl;
            if (_.isUndefined(jsonrpcUrl)) {
                throw new Error(`Deployer options don't contain provider nor jsonrpcUrl. Please pass one of them`);
            }
            provider = new Web3.providers.HttpProvider(jsonrpcUrl);
        } else {
            provider = (opts as ProviderDeployerOptions).provider;
        }
        this.web3Wrapper = new Web3Wrapper(provider, this._defaults);
    }
    /**
     * Loads a contract's corresponding artifacts and deploys it with the supplied constructor arguments.
     * @param contractName Name of the contract to deploy. Must match name of an artifact in supplied artifacts directory.
     * @param args Array of contract constructor arguments.
     * @return Deployed contract instance.
     */
    public async deployAsync(contractName: string, args: any[] = []): Promise<Web3.ContractInstance> {
        const contractArtifactIfExists: ContractArtifact = this._loadContractArtifactIfExists(contractName);
        const compilerOutput = Deployer._getContractCompilerOutputFromArtifactIfExists(contractArtifactIfExists);
        const data = compilerOutput.evm.bytecode.object;
        const from = await this._getFromAddressAsync();
        const gas = await this._getAllowableGasEstimateAsync(data);
        const txData = {
            gasPrice: this._defaults.gasPrice,
            from,
            data,
            gas,
        };
        const abi = compilerOutput.abi;
        const constructorAbi = _.find(abi, { type: AbiType.Constructor }) as ConstructorAbi;
        const constructorArgs = _.isUndefined(constructorAbi) ? [] : constructorAbi.inputs;
        if (constructorArgs.length !== args.length) {
            const constructorSignature = `constructor(${_.map(constructorArgs, arg => `${arg.type} ${arg.name}`).join(
                ', ',
            )})`;
            throw new Error(
                `${contractName} expects ${constructorArgs.length} constructor params: ${constructorSignature}. Got ${
                    args.length
                }`,
            );
        }
        const web3ContractInstance = await this._deployFromAbiAsync(abi, args, txData);
        logUtils.log(`${contractName}.sol successfully deployed at ${web3ContractInstance.address}`);
        const contractInstance = new Contract(web3ContractInstance, this._defaults);
        return contractInstance;
    }
    /**
     * Loads a contract's artifact, deploys it with supplied constructor arguments, and saves the updated data
     * back to the artifact file.
     * @param contractName Name of the contract to deploy. Must match name of an artifact in artifacts directory.
     * @param args Array of contract constructor arguments.
     * @return Deployed contract instance.
     */
    public async deployAndSaveAsync(contractName: string, args: any[] = []): Promise<Web3.ContractInstance> {
        const contractInstance = await this.deployAsync(contractName, args);
        await this._saveContractDataToArtifactAsync(contractName, contractInstance.address, args);
        return contractInstance;
    }
    /**
     * Deploys a contract given its ABI, arguments, and transaction data.
     * @param abi ABI of contract to deploy.
     * @param args Constructor arguments to use in deployment.
     * @param txData Tx options used for deployment.
     * @return Promise that resolves to a web3 contract instance.
     */
    private async _deployFromAbiAsync(abi: ContractAbi, args: any[], txData: TxData): Promise<any> {
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
                    logUtils.log(`transactionHash: ${res.transactionHash}`);
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
    private async _saveContractDataToArtifactAsync(
        contractName: string,
        contractAddress: string,
        args: any[],
    ): Promise<void> {
        const contractArtifactIfExists: ContractArtifact = this._loadContractArtifactIfExists(contractName);
        const compilerOutput = Deployer._getContractCompilerOutputFromArtifactIfExists(contractArtifactIfExists);
        const abi = compilerOutput.abi;
        const encodedConstructorArgs = encoder.encodeConstructorArgsFromAbi(args, abi);
        const newContractData: ContractNetworkData = {
            address: contractAddress,
            links: {},
            constructorArgs: encodedConstructorArgs,
        };
        const newArtifact = {
            ...contractArtifactIfExists,
            networks: {
                ...contractArtifactIfExists.networks,
                [this._networkId]: newContractData,
            },
        };
        const artifactString = utils.stringifyWithFormatting(newArtifact);
        const artifactPath = `${this._artifactsDir}/${contractName}.json`;
        await fsWrapper.writeFileAsync(artifactPath, artifactString);
    }
    /**
     * Loads a contract artifact, if it exists.
     * @param contractName Name of the contract, without the extension.
     * @return The contract artifact.
     */
    private _loadContractArtifactIfExists(contractName: string): ContractArtifact {
        const artifactPath = `${this._artifactsDir}/${contractName}.json`;
        try {
            const contractArtifact: ContractArtifact = require(artifactPath);
            return contractArtifact;
        } catch (err) {
            throw new Error(`Artifact not found for contract: ${contractName} at ${artifactPath}`);
        }
    }
    /**
     * Gets the address to use for sending a transaction.
     * @return The default from address. If not specified, returns the first address accessible by web3.
     */
    private async _getFromAddressAsync(): Promise<string> {
        let from: string;
        if (_.isUndefined(this._defaults.from)) {
            const accounts = await this.web3Wrapper.getAvailableAddressesAsync();
            from = accounts[0];
        } else {
            from = this._defaults.from;
        }
        return from;
    }
    /**
     * Estimates the gas required for a transaction.
     * If gas would be over the block gas limit, the max allowable gas is returned instead.
     * @param data Bytecode to estimate gas for.
     * @return Gas estimate for transaction data.
     */
    private async _getAllowableGasEstimateAsync(data: string): Promise<number> {
        const block = await this.web3Wrapper.getBlockAsync('latest');
        let gas: number;
        try {
            const gasEstimate: number = await this.web3Wrapper.estimateGasAsync({ data });
            gas = Math.min(gasEstimate + EXTRA_GAS, block.gasLimit);
        } catch (err) {
            gas = block.gasLimit;
        }
        return gas;
    }
}
