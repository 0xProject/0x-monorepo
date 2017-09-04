import * as _ from 'lodash';
import * as Web3 from 'web3';
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {ZeroExError} from './types';
import {Contract} from './contract';

export class Web3Wrapper {
    private web3: Web3;
    private networkIdIfExists?: number;
    constructor(provider: Web3.Provider) {
        this.web3 = new Web3();
        this.web3.setProvider(provider);
    }
    public setProvider(provider: Web3.Provider) {
        delete this.networkIdIfExists;
        this.web3.setProvider(provider);
    }
    public isAddress(address: string): boolean {
        return this.web3.isAddress(address);
    }
    public async isSenderAddressAvailableAsync(senderAddress: string): Promise<boolean> {
        const addresses = await this.getAvailableAddressesAsync();
        return _.includes(addresses, senderAddress);
    }
    public async getNodeVersionAsync(): Promise<string> {
        const nodeVersion = await promisify(this.web3.version.getNode)();
        return nodeVersion;
    }
    public getCurrentProvider(): Web3.Provider {
        return this.web3.currentProvider;
    }
    public async getNetworkIdIfExistsAsync(): Promise<number|undefined> {
        if (!_.isUndefined(this.networkIdIfExists)) {
          return this.networkIdIfExists;
        }

        try {
            const networkId = await this.getNetworkAsync();
            this.networkIdIfExists = Number(networkId);
            return this.networkIdIfExists;
        } catch (err) {
            return undefined;
        }
    }
    public async getContractInstanceFromArtifactAsync<A extends Web3.ContractInstance>(artifact: Artifact,
                                                                                       address?: string): Promise<A> {
        if (_.isUndefined(address)) {
            const networkIdIfExists = await this.getNetworkIdIfExistsAsync();
            if (_.isUndefined(networkIdIfExists)) {
                throw new Error(ZeroExError.NoNetworkId);
            }
            if (_.isUndefined(artifact.networks[networkIdIfExists])) {
                throw new Error(ZeroExError.ContractNotDeployedOnNetwork);
            }
            address = artifact.networks[networkIdIfExists].address.toLowerCase();
        }
        const doesContractExist = await this.doesContractExistAtAddressAsync(address);
        if (!doesContractExist) {
            throw new Error(ZeroExError.ContractDoesNotExist);
        }
        const contractInstance = this.getContractInstance<A>(
            artifact.abi, address,
        );
        return contractInstance;
    }
    public toWei(ethAmount: BigNumber.BigNumber): BigNumber.BigNumber {
        const balanceWei = this.web3.toWei(ethAmount, 'ether');
        return balanceWei;
    }
    public async getBalanceInWeiAsync(owner: string): Promise<BigNumber.BigNumber> {
        let balanceInWei = await promisify(this.web3.eth.getBalance)(owner);
        balanceInWei = new BigNumber(balanceInWei);
        return balanceInWei;
    }
    public async doesContractExistAtAddressAsync(address: string): Promise<boolean> {
        const code = await promisify(this.web3.eth.getCode)(address);
        // Regex matches 0x0, 0x00, 0x in order to accommodate poorly implemented clients
        const codeIsEmpty = /^0x0{0,40}$/i.test(code);
        return !codeIsEmpty;
    }
    public async signTransactionAsync(address: string, message: string): Promise<string> {
        const signData = await promisify(this.web3.eth.sign)(address, message);
        return signData;
    }
    public async getBlockTimestampAsync(blockHash: string): Promise<number> {
        const {timestamp} = await promisify(this.web3.eth.getBlock)(blockHash);
        return timestamp;
    }
    public async getAvailableAddressesAsync(): Promise<string[]> {
        const addresses: string[] = await promisify(this.web3.eth.getAccounts)();
        return addresses;
    }
    private getContractInstance<A extends Web3.ContractInstance>(abi: Web3.ContractAbi, address: string): A {
        const web3ContractInstance = this.web3.eth.contract(abi).at(address);
        const contractInstance = new Contract(web3ContractInstance) as any as A;
        return contractInstance;
    }
    private async getNetworkAsync(): Promise<number> {
        const networkId = await promisify(this.web3.version.getNetwork)();
        return networkId;
    }
}
