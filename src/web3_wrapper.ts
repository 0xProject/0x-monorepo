import * as _ from 'lodash';
import * as Web3 from 'web3';
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {ZeroExError} from './types';
import {assert} from './utils/assert';

export class Web3Wrapper {
    private web3: Web3;
    constructor(web3: Web3) {
        this.web3 = new Web3();
        this.web3.setProvider(web3.currentProvider);
    }
    public setProvider(provider: Web3.Provider) {
        this.web3.setProvider(provider);
    }
    public isAddress(address: string): boolean {
        return this.web3.isAddress(address);
    }
    public getDefaultAccount(): string {
        return this.web3.eth.defaultAccount;
    }
    public setDefaultAccount(address: string): void {
        this.web3.eth.defaultAccount = address;
    }
    public async getSenderAddressOrThrowAsync(): Promise<string> {
        const senderAddressIfExists = await this.getSenderAddressIfExistsAsync();
        assert.assert(!_.isUndefined(senderAddressIfExists), ZeroExError.USER_HAS_NO_ASSOCIATED_ADDRESSES);
        return senderAddressIfExists as string;
    }
    public async getFirstAddressIfExistsAsync(): Promise<string|undefined> {
        const addresses = await this.getAvailableSenderAddressesAsync();
        if (_.isEmpty(addresses)) {
            return undefined;
        }
        return addresses[0];
    }
    public async isSenderAddressAvailableAsync(senderAddress: string): Promise<boolean> {
        const addresses = await this.getAvailableSenderAddressesAsync();
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
        try {
            const networkId = await this.getNetworkAsync();
            return Number(networkId);
        } catch (err) {
            return undefined;
        }
    }
    public async getBalanceInEthAsync(owner: string): Promise<BigNumber.BigNumber> {
        const balanceInWei = await promisify(this.web3.eth.getBalance)(owner);
        const balanceEth = this.web3.fromWei(balanceInWei, 'ether');
        return balanceEth;
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
    public async getSenderAddressIfExistsAsync(): Promise<string|undefined> {
        const defaultAccount = this.web3.eth.defaultAccount;
        if (!_.isUndefined(defaultAccount)) {
            return defaultAccount;
        }
        const firstAccount = await this.getFirstAddressIfExistsAsync();
        return firstAccount;
    }
    private async getAvailableSenderAddressesAsync(): Promise<string[]> {
        const addresses: string[] = await promisify(this.web3.eth.getAccounts)();
        return addresses;
    }
    private async getNetworkAsync(): Promise<number> {
        const networkId = await promisify(this.web3.version.getNetwork)();
        return networkId;
    }
}
