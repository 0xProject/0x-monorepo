import { ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import { Store } from 'redux';

import { Dispatcher } from '../redux/dispatcher';
import { State } from '../redux/reducer';
import { AccountTokenBalances, AccountWeiBalances } from '../types';

const POLLING_INTERVAL = 2000;
const BALANCE_POLLING_INTERVAL = 5000;

/**
 * Watch for user account changes and network changes
 * which are outside of our control. I.e injected web3 providers, balance changes
 */
export class BlockchainSaga {
    private _store: Store<State>;
    private _dispatch: Dispatcher;
    private _web3Wrapper: Web3Wrapper;
    private _zeroEx: ZeroEx;
    private _prevState: State;
    constructor(dispatch: Dispatcher, store: Store<State>, web3Wrapper: Web3Wrapper, zeroEx: ZeroEx) {
        this._dispatch = dispatch;
        this._web3Wrapper = web3Wrapper;
        this._store = store;
        this._zeroEx = zeroEx;
        this._startPolling().catch(console.log);
        store.subscribe(this._handleStateChange.bind(this));
        this._handleStateChange();
    }
    // The intention here is to stop any long running processes
    // if they are not relevant anymore. I.e watching for balance changes
    // on an old network.
    private _handleStateChange() {
        const nextState = this._store.getState();
        const lastAction = nextState.lastAction;
        if (nextState !== this._prevState) {
            this._prevState = nextState;
        }
    }
    private async _startPolling() {
        await this._checkBlockchainAsync();
        await this._checkBalancesAsync();
        setInterval(this._checkBlockchainAsync.bind(this), POLLING_INTERVAL);
        setInterval(this._checkBalancesAsync.bind(this), BALANCE_POLLING_INTERVAL);
    }
    private async _checkBlockchainAsync() {
        await this._checkUserAccountAsync();
        await this._checkNetworkIdAsync();
    }
    private async _checkBalancesAsync() {
        await this._checkUserBalanceAsync();
        await this._checkTokenBalanceAsync();
    }

    private async _checkTokenBalanceAsync() {
        const currentToken = this._store.getState().selectedToken;
        const currentUser = this._store.getState().userAddress;
        const userTokenBalances = this._store.getState().userTokenBalances[currentUser];
        let tokenBalance = new BigNumber(0);

        // TODO this won't work for the many tokens and NFTs not in the registry
        const tokenAddress = await this._zeroEx.tokenRegistry.getTokenAddressBySymbolIfExistsAsync(currentToken);
        if (tokenAddress) {
            tokenBalance = await this._zeroEx.token.getBalanceAsync(tokenAddress, currentUser);
        }
        if (_.isUndefined(userTokenBalances[currentToken]) || !tokenBalance.eq(userTokenBalances[currentToken])) {
            this._dispatch.updateUserTokenBalance(currentUser, tokenBalance, currentToken);
        }
    }

    private async _checkUserBalanceAsync() {
        const userAccount = this._store.getState().userAddress;
        const usersWeiBalance = this._store.getState().usersWeiBalance;
        const userWeiBalance = await this._web3Wrapper.getBalanceInWeiAsync(userAccount);
        if (_.isUndefined(usersWeiBalance[userAccount]) || !userWeiBalance.eq(usersWeiBalance[userAccount])) {
            this._dispatch.updateUserWeiBalance(userAccount, userWeiBalance);
        }
    }

    private async _checkNetworkIdAsync() {
        const currentNetworkId = await this._web3Wrapper.getNetworkIdAsync();
        const networkId = this._store.getState().networkId;
        if (networkId !== currentNetworkId) {
            this._dispatch.updateNetworkId(currentNetworkId);
        }
    }

    private async _checkUserAccountAsync() {
        const userAccounts = await this._web3Wrapper.getAvailableAddressesAsync();
        const currentUserAccount = userAccounts[0];
        const userAccount = this._store.getState().userAddress;
        if (userAccount !== currentUserAccount) {
            this._dispatch.updateUserAddress(currentUserAccount);
        }
    }
}
