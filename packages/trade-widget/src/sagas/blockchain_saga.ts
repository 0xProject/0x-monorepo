import { ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import { Store } from 'redux';

import { Dispatcher } from '../redux/dispatcher';
import { State } from '../redux/reducer';

const POLLING_INTERVAL = 3000;

/**
 * Watch for user account changes and network changes
 * which are outside of our control. I.e injected web3 providers
 */
export class BlockchainSaga {
    private _zeroEx: ZeroEx;
    private _store: Store<State>;
    private _networkId: number;
    private _dispatch: Dispatcher;
    private _userAccount: string;
    private _userWeiBalance: BigNumber = new BigNumber(0);
    private _web3Wrapper: Web3Wrapper;
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
        const userAccounts = await this._web3Wrapper.getAvailableAddressesAsync();
        const userAccount = userAccounts[0];
        if (this._userAccount !== userAccount) {
            this._userAccount = userAccount;
            this._userWeiBalance = undefined;
            this._dispatch.updateUserAddress(this._userAccount);
        }
        const networkId = await this._web3Wrapper.getNetworkIdAsync();
        if (this._networkId !== networkId) {
            this._networkId = networkId;
            this._dispatch.updateNetworkId(this._networkId);
        }
        const userWeiBalance = await this._web3Wrapper.getBalanceInWeiAsync(this._userAccount);
        if (!_.isUndefined(userWeiBalance)) {
            if (_.isUndefined(this._userWeiBalance) || !userWeiBalance.eq(this._userWeiBalance)) {
                this._userWeiBalance = userWeiBalance;
                this._dispatch.updateUserWeiBalance(this._userWeiBalance);
            }
        }
        const currentOrder = this._store.getState().order;
        const currentToken = this._store.getState().selectedToken;
        let tokenBalance = new BigNumber(0);
        if (!_.isUndefined(currentOrder)) {
            tokenBalance = await this._zeroEx.token.getBalanceAsync(currentOrder.makerTokenAddress, this._userAccount);
        }
        this._dispatch.updateUserTokenBalance(tokenBalance);
    }
}
