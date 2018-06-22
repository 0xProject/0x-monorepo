import { BigNumber, intervalUtils, logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import { Dispatcher } from 'ts/redux/dispatcher';

export class BlockchainWatcher {
    private _dispatcher: Dispatcher;
    private _web3Wrapper: Web3Wrapper;
    private _prevNetworkId: number;
    private _shouldPollUserAddress: boolean;
    private _watchBalanceIntervalId: NodeJS.Timer;
    private _prevUserEtherBalanceInWei?: BigNumber;
    private _prevUserAddressIfExists: string;
    constructor(
        dispatcher: Dispatcher,
        web3Wrapper: Web3Wrapper,
        networkIdIfExists: number,
        shouldPollUserAddress: boolean,
    ) {
        this._dispatcher = dispatcher;
        this._prevNetworkId = networkIdIfExists;
        this._shouldPollUserAddress = shouldPollUserAddress;
        this._web3Wrapper = web3Wrapper;
    }
    public destroy(): void {
        this._stopEmittingUserBalanceState();
        // HACK: stop() is only available on providerEngine instances
        const provider = this._web3Wrapper.getProvider();
        if (!_.isUndefined((provider as any).stop)) {
            (provider as any).stop();
        }
    }
    // This should only be called from the LedgerConfigDialog
    public updatePrevUserAddress(userAddress: string): void {
        this._prevUserAddressIfExists = userAddress;
    }
    public async startEmittingUserBalanceStateAsync(): Promise<void> {
        if (!_.isUndefined(this._watchBalanceIntervalId)) {
            return; // we are already emitting the state
        }
        this._prevUserEtherBalanceInWei = undefined;
        await this._updateBalanceAsync();
        this._watchBalanceIntervalId = intervalUtils.setAsyncExcludingInterval(
            this._updateBalanceAsync.bind(this),
            5000,
            (err: Error) => {
                logUtils.log(`Watching network and balances failed: ${err.stack}`);
                this._stopEmittingUserBalanceState();
            },
        );
    }
    private async _updateBalanceAsync(): Promise<void> {
        let prevNodeVersion: string;
        // Check for node version changes
        const currentNodeVersion = await this._web3Wrapper.getNodeVersionAsync();
        if (currentNodeVersion !== prevNodeVersion) {
            prevNodeVersion = currentNodeVersion;
            this._dispatcher.updateNodeVersion(currentNodeVersion);
        }

        if (this._shouldPollUserAddress) {
            const addresses = await this._web3Wrapper.getAvailableAddressesAsync();
            const userAddressIfExists = addresses[0];
            // Update makerAddress on network change
            if (this._prevUserAddressIfExists !== userAddressIfExists) {
                this._prevUserAddressIfExists = userAddressIfExists;
                this._dispatcher.updateUserAddress(userAddressIfExists);
            }

            // Check for user ether balance changes
            if (!_.isUndefined(userAddressIfExists)) {
                await this._updateUserWeiBalanceAsync(userAddressIfExists);
            }
        } else {
            // This logic is primarily for the Ledger, since we don't regularly poll for the address
            // we simply update the balance for the last fetched address.
            if (!_.isUndefined(this._prevUserAddressIfExists)) {
                await this._updateUserWeiBalanceAsync(this._prevUserAddressIfExists);
            }
        }
    }
    private async _updateUserWeiBalanceAsync(userAddress: string): Promise<void> {
        const balanceInWei = await this._web3Wrapper.getBalanceInWeiAsync(userAddress);
        if (_.isUndefined(this._prevUserEtherBalanceInWei) || !balanceInWei.eq(this._prevUserEtherBalanceInWei)) {
            this._prevUserEtherBalanceInWei = balanceInWei;
            this._dispatcher.updateUserWeiBalance(balanceInWei);
        }
    }
    private _stopEmittingUserBalanceState(): void {
        if (!_.isUndefined(this._watchBalanceIntervalId)) {
            intervalUtils.clearAsyncExcludingInterval(this._watchBalanceIntervalId);
        }
    }
}
