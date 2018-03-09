import { BigNumber, intervalUtils, promisify } from '@0xproject/utils';
import { Web3Wrapper as Web3WrapperBase } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import { Dispatcher } from 'ts/redux/dispatcher';
import { utils } from 'ts/utils/utils';
import * as Web3 from 'web3';

export class Web3Wrapper extends Web3WrapperBase {
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
        super(provider);
        this._dispatcher = dispatcher;
        this._prevNetworkId = networkIdIfExists;
        this._shouldPollUserAddress = shouldPollUserAddress;

        this._web3 = new Web3();
        this._web3.setProvider(provider);
    }
    public async getFirstAccountIfExistsAsync() {
        const addresses = await this.getAvailableAddressesAsync();
        if (_.isEmpty(addresses)) {
            return '';
        }
        return addresses[0];
    }
    public getProviderObj() {
        return this._web3.currentProvider;
    }
    public async getNetworkIdIfExistsAsync(): Promise<number | undefined> {
        try {
            const networkId = await this.getNetworkIdAsync();
            return Number(networkId);
        } catch (err) {
            return undefined;
        }
    }
    public async getBalanceInEthAsync(owner: string): Promise<BigNumber> {
        const balanceInWei = await this.getBalanceInWeiAsync(owner);
        const balanceEthOldBigNumber = this._web3.fromWei(balanceInWei, 'ether');
        const balanceEth = new BigNumber(balanceEthOldBigNumber);
        return balanceEth;
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
    public startEmittingNetworkConnectionAndUserBalanceState() {
        if (!_.isUndefined(this._watchNetworkAndBalanceIntervalId)) {
            return; // we are already emitting the state
        }

        let prevNodeVersion: string;
        this._prevUserEtherBalanceInEth = new BigNumber(0);
        this._dispatcher.updateNetworkId(this._prevNetworkId);
        this._watchNetworkAndBalanceIntervalId = intervalUtils.setAsyncExcludingInterval(
            async () => {
                // Check for network state changes
                const currentNetworkId = await this.getNetworkIdIfExistsAsync();
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
                    if (!_.isEmpty(userAddressIfExists)) {
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
                utils.consoleLog(`Watching network and balances failed: ${err.stack}`);
                this._stopEmittingNetworkConnectionAndUserBalanceStateAsync();
            },
        );
    }
    private async _updateUserEtherBalanceAsync(userAddress: string) {
        const balance = await this.getBalanceInEthAsync(userAddress);
        if (!balance.eq(this._prevUserEtherBalanceInEth)) {
            this._prevUserEtherBalanceInEth = balance;
            this._dispatcher.updateUserEtherBalance(balance);
        }
    }
    private _stopEmittingNetworkConnectionAndUserBalanceStateAsync() {
        if (!_.isUndefined(this._watchNetworkAndBalanceIntervalId)) {
            intervalUtils.clearAsyncExcludingInterval(this._watchNetworkAndBalanceIntervalId);
        }
    }
}
