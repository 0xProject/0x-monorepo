import { ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import { Store } from 'redux';

import { Dispatcher } from '../redux/dispatcher';
import { State } from '../redux/reducer';
import { AccountTokenBalances, AccountWeiBalances } from '../types';

const POLLING_INTERVAL = 3000;

/**
 * Watch for user account changes and network changes
 * which are outside of our control. I.e injected web3 providers
 */
export class BlockchainSaga {
    private _store: Store<State>;
    private _networkId: number;
    private _dispatch: Dispatcher;
    // private _userWeiBalances: AccountWeiBalances = {};
    private _web3Wrapper: Web3Wrapper;
    private _zeroEx: ZeroEx;
    constructor(dispatch: Dispatcher, store: Store<State>, web3Wrapper: Web3Wrapper, zeroEx: ZeroEx) {
        this._dispatch = dispatch;
        this._web3Wrapper = web3Wrapper;
        this._store = store;
        this._zeroEx = zeroEx;
        this._startPolling();
    }
    private _startPolling() {
        setInterval(this._checkBlockchainAsync.bind(this), POLLING_INTERVAL);
    }
    private async _checkBlockchainAsync() {
        await this._checkUserAccountAsync();
        await this._checkNetworkIdAsync();
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
        const networkId = await this._web3Wrapper.getNetworkIdAsync();
        if (this._networkId !== networkId) {
            this._networkId = networkId;
            this._dispatch.updateNetworkId(this._networkId);
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
