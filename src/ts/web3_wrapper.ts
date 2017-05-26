import * as _ from 'lodash';
import Web3 = require('web3');
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');

export class Web3Wrapper {
    private web3: Web3;
    constructor(web3: Web3) {
        this.web3 = new Web3();
        this.web3.setProvider(web3.currentProvider);
    }
    public isAddress(address: string): boolean {
        return this.web3.isAddress(address);
    }
    public async getSenderAddressIfExistsAsync(): Promise<string> {
        const defaultAccount = this.web3.eth.defaultAccount;
        if (!_.isUndefined(defaultAccount)) {
            return defaultAccount;
        }
        const firstAccount = await this.getFirstAddressIfExistsAsync();
        return firstAccount;
    }
    public async getFirstAddressIfExistsAsync(): Promise<string> {
        const addresses = await promisify(this.web3.eth.getAccounts)();
        if (_.isEmpty(addresses)) {
            return '';
        }
        return (addresses as string[])[0];
    }
    public async getNodeVersionAsync(): Promise<string> {
        const nodeVersion = await promisify(this.web3.version.getNode)();
        return nodeVersion;
    }
    public getCurrentProvider(): Web3.Provider {
        return this.web3.currentProvider;
    }
    public async getNetworkIdIfExistsAsync() {
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
        // Regex matches 0x0, 0x00, 0x in order to accomodate poorly implemented clients
        const zeroHexAddressRegex = /^0[xX][0]*$/;
        const didFindCode = _.isNull(code.match(zeroHexAddressRegex));
        return didFindCode;
    }
    // Note: since `sign` is overloaded to be both a sync and async method, it doesn't play nice
    // with our callAsync method. We therefore handle it here as a special case.
    public async signTransactionAsync(address: string, message: string): Promise<string> {
        const signData = await promisify(this.web3.eth.sign)(address, message);
        return signData;
    }
    public async getBlockTimestampAsync(blockHash: string): Promise<number> {
        const {timestamp} = await promisify(this.web3.eth.getBlock)(blockHash);
        return timestamp;
    }
    private async getNetworkAsync() {
        const networkId = await promisify(this.web3.version.getNetwork)();
        return networkId;
    }
}
