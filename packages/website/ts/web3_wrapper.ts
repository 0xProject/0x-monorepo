import { BigNumber, intervalUtils, promisify } from '@0xproject/utils';
import * as _ from 'lodash';
import { Dispatcher } from 'ts/redux/dispatcher';
import { utils } from 'ts/utils/utils';
import * as Web3 from 'web3';

export class Web3Wrapper {
    private _dispatcher: Dispatcher;
    private _web3: Web3;
    private _prevNetworkId: number;
    private _shouldPollUserAddress: boolean;
    private _watchNetworkAndBalanceIntervalId: NodeJS.Timer;
    private _prevUserEtherBalanceInEth: BigNumber;
    private _prevUserAddress: string;
    constructor(
        dispatcher: Dispatcher,
        provider: Web3.Provider,
        networkIdIfExists: number,
        shouldPollUserAddress: boolean,
    ) {
        this._dispatcher = dispatcher;
        this._prevNetworkId = networkIdIfExists;
        this._shouldPollUserAddress = shouldPollUserAddress;

        this._web3 = new Web3();
        this._web3.setProvider(provider);
    }
    public isAddress(address: string) {
        return this._web3.isAddress(address);
    }
    public async getAccountsAsync(): Promise<string[]> {
        const addresses = await promisify<string[]>(this._web3.eth.getAccounts)();
        return addresses;
    }
    public async getFirstAccountIfExistsAsync() {
        const addresses = await this.getAccountsAsync();
        if (_.isEmpty(addresses)) {
            return '';
        }
        return addresses[0];
    }
    public async getNodeVersionAsync(): Promise<string> {
        const nodeVersion = await promisify<string>(this._web3.version.getNode)();
        return nodeVersion;
    }
    public getProviderObj() {
        return this._web3.currentProvider;
    }
    public async getNetworkIdIfExists() {
        try {
            const networkId = await this._getNetworkAsync();
            return Number(networkId);
        } catch (err) {
            return undefined;
        }
    }
    public async getBalanceInEthAsync(owner: string): Promise<BigNumber> {
        const balanceInWei: BigNumber = await promisify<BigNumber>(this._web3.eth.getBalance)(owner);
        const balanceEthOldBigNumber = this._web3.fromWei(balanceInWei, 'ether');
        const balanceEth = new BigNumber(balanceEthOldBigNumber);
        return balanceEth;
    }
    public async doesContractExistAtAddressAsync(address: string): Promise<boolean> {
        const code = await promisify<string>(this._web3.eth.getCode)(address);
        // Regex matches 0x0, 0x00, 0x in order to accomodate poorly implemented clients
        const zeroHexAddressRegex = /^0[xX][0]*$/;
        const didFindCode = _.isNull(code.match(zeroHexAddressRegex));
        return didFindCode;
    }
    public async signTransactionAsync(address: string, message: string): Promise<string> {
        const signData = await promisify<string>(this._web3.eth.sign)(address, message);
        return signData;
    }
    public async getBlockTimestampAsync(blockHash: string): Promise<number> {
        const { timestamp } = await promisify<Web3.BlockWithoutTransactionData>(this._web3.eth.getBlock)(blockHash);
        return timestamp;
    }
    public destroy() {
        this._stopEmittingNetworkConnectionAndUserBalanceStateAsync();
        // HACK: stop() is only available on providerEngine instances
        const provider = this._web3.currentProvider;
        if (!_.isUndefined((provider as any).stop)) {
            (provider as any).stop();
        }
    }
    // This should only be called from the LedgerConfigDialog
    public updatePrevUserAddress(userAddress: string) {
        this._prevUserAddress = userAddress;
    }
    public async startEmittingNetworkConnectionAndUserBalanceStateAsync() {
        if (!_.isUndefined(this._watchNetworkAndBalanceIntervalId)) {
            return; // we are already emitting the state
        }

        let prevNodeVersion: string;
        this._prevUserEtherBalanceInEth = new BigNumber(0);
        this._dispatcher.updateNetworkId(this._prevNetworkId);
        this._watchNetworkAndBalanceIntervalId = intervalUtils.setAsyncExcludingInterval(
            async () => {
                // Check for network state changes
                const currentNetworkId = await this.getNetworkIdIfExists();
                if (currentNetworkId !== this._prevNetworkId) {
                    this._prevNetworkId = currentNetworkId;
                    this._dispatcher.updateNetworkId(currentNetworkId);
                }

                // Check for node version changes
                const currentNodeVersion = await this.getNodeVersionAsync();
                if (currentNodeVersion !== prevNodeVersion) {
                    prevNodeVersion = currentNodeVersion;
                    this._dispatcher.updateNodeVersion(currentNodeVersion);
                }

                if (this._shouldPollUserAddress) {
                    const userAddressIfExists = await this.getFirstAccountIfExistsAsync();
                    // Update makerAddress on network change
                    if (this._prevUserAddress !== userAddressIfExists) {
                        this._prevUserAddress = userAddressIfExists;
                        this._dispatcher.updateUserAddress(userAddressIfExists);
                    }

                    // Check for user ether balance changes
                    if (userAddressIfExists !== '') {
                        await this._updateUserEtherBalanceAsync(userAddressIfExists);
                    }
                } else {
                    // This logic is primarily for the Ledger, since we don't regularly poll for the address
                    // we simply update the balance for the last fetched address.
                    if (!_.isEmpty(this._prevUserAddress)) {
                        await this._updateUserEtherBalanceAsync(this._prevUserAddress);
                    }
                }
            },
            5000,
            (err: Error) => {
                utils.consoleLog(`Watching network and balances failed: ${err}, ${err.stack}`);
                this._stopEmittingNetworkConnectionAndUserBalanceStateAsync();
            },
        );
    }
    private async _getNetworkAsync() {
        const networkId = await promisify(this._web3.version.getNetwork)();
        return networkId;
    }
    private async _updateUserEtherBalanceAsync(userAddress: string) {
        const balance = await this.getBalanceInEthAsync(userAddress);
        if (!balance.eq(this._prevUserEtherBalanceInEth)) {
            this._prevUserEtherBalanceInEth = balance;
            this._dispatcher.updateUserEtherBalance(balance);
        }
    }
    private _stopEmittingNetworkConnectionAndUserBalanceStateAsync() {
        intervalUtils.clearAsyncExcludingInterval(this._watchNetworkAndBalanceIntervalId);
    }
}
