import { SignedOrder, TransactionReceiptWithDecodedLogs } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import { Dispatch } from 'redux';
import thunk from 'redux-thunk';

import { ActionTypes, AssetToken, LiquidityProvider, TokenPair } from '../types';

import { State } from './reducer';

export class Dispatcher {
    private _dispatch: Dispatch<State>;
    private _liquidityProvider: LiquidityProvider;
    constructor(dispatch: Dispatch<State>, liquidityProvider: LiquidityProvider) {
        this._dispatch = dispatch;
        this._liquidityProvider = liquidityProvider;
    }
    public updateNetworkId(networkId: number) {
        this._dispatch({
            data: networkId,
            type: ActionTypes.UpdateNetworkId,
        });
    }
    public updateUserAddress(address: string) {
        this._dispatch({
            data: address,
            type: ActionTypes.UpdateUserAddress,
        });
    }
    public updateUserWeiBalance(address: string, balance: BigNumber) {
        this._dispatch({
            data: { address, balance },
            type: ActionTypes.UpdateUserWeiBalance,
        });
    }
    public updateUserTokenBalance(address: string, balance: BigNumber, token: AssetToken) {
        this._dispatch({
            data: { address, balance, token },
            type: ActionTypes.UpdateUserTokenBalance,
        });
    }
    public updateSelectedToken(token: AssetToken) {
        this._dispatch({
            data: token,
            type: ActionTypes.UpdateSelectedToken,
        });
    }
    public transactionSubmitted(txHash: string) {
        this._dispatch({
            data: txHash,
            type: ActionTypes.TransactionSubmitted,
        });
    }
    public quoteRequested(amount: BigNumber, pair: TokenPair) {
        const quoteRequestThunk = async (dispatch: Dispatch<State>, getState: () => State): Promise<void> => {
            if (getState().isQuoting) {
                return;
            }
            dispatch({
                data: { amount, pair },
                type: ActionTypes.QuoteRequested,
            });

            const quote = await this._liquidityProvider.requestQuoteAsync(amount, pair);
            dispatch({
                data: { quote },
                type: ActionTypes.QuoteReceived,
            });
        };
        // tslint:disable-next-line
        this._dispatch(quoteRequestThunk);
    }
    public transactionMined(receipt: TransactionReceiptWithDecodedLogs) {
        this._dispatch({
            data: receipt,
            type: ActionTypes.TransactionMined,
        });
    }
}
