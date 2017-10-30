import * as _ from 'lodash';
import {schemas} from '0x-json-schemas';
import {ZeroEx} from '../';
import {EventWatcher} from './event_watcher';
import {assert} from '../utils/assert';
import {artifacts} from '../artifacts';
import {AbiDecoder} from '../utils/abi_decoder';
import {OrderStateUtils} from '../utils/order_state_utils';
import {
    LogEvent,
    OrderState,
    SignedOrder,
    Web3Provider,
    BlockParamLiteral,
    LogWithDecodedArgs,
    OnOrderStateChangeCallback,
} from '../types';
import {Web3Wrapper} from '../web3_wrapper';

export class OrderStateWatcher {
    private _orders = new Map<string, SignedOrder>();
    private _web3Wrapper: Web3Wrapper;
    private _callbackAsync?: OnOrderStateChangeCallback;
    private _eventWatcher: EventWatcher;
    private _abiDecoder: AbiDecoder;
    private _orderStateUtils: OrderStateUtils;
    constructor(
        web3Wrapper: Web3Wrapper, abiDecoder: AbiDecoder, orderStateUtils: OrderStateUtils,
        mempoolPollingIntervalMs?: number) {
        this._web3Wrapper = web3Wrapper;
        this._eventWatcher = new EventWatcher(
            this._web3Wrapper, mempoolPollingIntervalMs,
        );
        this._abiDecoder = abiDecoder;
        this._orderStateUtils = orderStateUtils;
    }
    public addOrder(signedOrder: SignedOrder): void {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        const orderHash = ZeroEx.getOrderHashHex(signedOrder);
        this._orders.set(orderHash, signedOrder);
    }
    public removeOrder(signedOrder: SignedOrder): void {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        const orderHash = ZeroEx.getOrderHashHex(signedOrder);
        this._orders.delete(orderHash);
    }
    public subscribe(callback: OnOrderStateChangeCallback): void {
        assert.isFunction('callback', callback);
        this._callbackAsync = callback;
        this._eventWatcher.subscribe(this._onMempoolEventCallbackAsync.bind(this));
    }
    public unsubscribe(): void {
        delete this._callbackAsync;
        this._eventWatcher.unsubscribe();
    }
    private async _onMempoolEventCallbackAsync(log: LogEvent): Promise<void> {
        const maybeDecodedLog = this._abiDecoder.tryToDecodeLogOrNoop(log);
        if (!_.isUndefined((maybeDecodedLog as LogWithDecodedArgs<any>).event)) {
            await this._revalidateOrdersAsync();
        }
    }
    private async _revalidateOrdersAsync(): Promise<void> {
        const methodOpts = {
            defaultBlock: BlockParamLiteral.Pending,
        };
        const orderHashes = Array.from(this._orders.keys());
        for (const orderHash of orderHashes) {
            const signedOrder = this._orders.get(orderHash) as SignedOrder;
            const orderState = await this._orderStateUtils.getOrderStateAsync(signedOrder, methodOpts);
            if (!_.isUndefined(this._callbackAsync)) {
                await this._callbackAsync(orderState);
            } else {
                break; // Unsubscribe was called
            }
        }
    }
}
