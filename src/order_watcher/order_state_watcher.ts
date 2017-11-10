import * as _ from 'lodash';
import {schemas} from '0x-json-schemas';
import * as ethUtil from 'ethereumjs-util';
import {ZeroEx} from '../0x';
import {EventWatcher} from './event_watcher';
import {assert} from '../utils/assert';
import {utils} from '../utils/utils';
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
    OrderStateWatcherConfig,
    ExchangeEvents,
    TokenEvents,
    ZeroExError,
} from '../types';
import {Web3Wrapper} from '../web3_wrapper';

const DEFAULT_NUM_CONFIRMATIONS = 0;

interface DependentOrderHashes {
    [makerAddress: string]: {
        [makerToken: string]: Set<string>,
    };
}

interface OrderByOrderHash {
    [orderHash: string]: SignedOrder;
}

/**
 * This class includes all the functionality related to watching a set of orders
 * for potential changes in order validity/fillability. The orderWatcher notifies
 * the subscriber of these changes so that a final decison can be made on whether
 * the order should be deemed invalid.
 */
export class OrderStateWatcher {
    private _orderByOrderHash: OrderByOrderHash = {};
    private _dependentOrderHashes: DependentOrderHashes = {};
    private _web3Wrapper: Web3Wrapper;
    private _callbackIfExistsAsync?: OnOrderStateChangeCallback;
    private _eventWatcher: EventWatcher;
    private _abiDecoder: AbiDecoder;
    private _orderStateUtils: OrderStateUtils;
    private _numConfirmations: number;
    constructor(
        web3Wrapper: Web3Wrapper, abiDecoder: AbiDecoder, orderStateUtils: OrderStateUtils,
        config?: OrderStateWatcherConfig,
    ) {
        this._web3Wrapper = web3Wrapper;
        const eventPollingIntervalMs = _.isUndefined(config) ? undefined : config.pollingIntervalMs;
        this._numConfirmations = _.isUndefined(config) ?
                                    DEFAULT_NUM_CONFIRMATIONS
                                    : config.numConfirmations;
        this._eventWatcher = new EventWatcher(
            this._web3Wrapper, eventPollingIntervalMs, this._numConfirmations,
        );
        this._abiDecoder = abiDecoder;
        this._orderStateUtils = orderStateUtils;
    }
    /**
     * Add an order to the orderStateWatcher. Before the order is added, it's
     * signature is verified.
     * @param   signedOrder     The order you wish to start watching.
     */
    public addOrder(signedOrder: SignedOrder): void {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        const orderHash = ZeroEx.getOrderHashHex(signedOrder);
        assert.isValidSignature(orderHash, signedOrder.ecSignature, signedOrder.maker);
        this._orderByOrderHash[orderHash] = signedOrder;
        this.addToDependentOrderHashes(signedOrder, orderHash);
    }
    /**
     * Removes an order from the orderStateWatcher
     * @param   orderHash     The orderHash of the order you wish to stop watching.
     */
    public removeOrder(orderHash: string): void {
        assert.doesConformToSchema('orderHash', orderHash, schemas.orderHashSchema);
        const signedOrder = this._orderByOrderHash[orderHash];
        if (_.isUndefined(signedOrder)) {
            return; // noop
        }
        delete this._orderByOrderHash[orderHash];
        this.removeFromDependentOrderHashes(signedOrder.maker, signedOrder.makerTokenAddress, orderHash);
    }
    /**
     * Starts an orderStateWatcher subscription. The callback will be called every time a watched order's
     * backing blockchain state has changed. This is a call-to-action for the caller to re-validate the order.
     * @param   callback            Receives the orderHash of the order that should be re-validated, together
     *                              with all the order-relevant blockchain state needed to re-validate the order.
     */
    public subscribe(callback: OnOrderStateChangeCallback): void {
        assert.isFunction('callback', callback);
        if (!_.isUndefined(this._callbackIfExistsAsync)) {
            throw new Error(ZeroExError.SubscriptionAlreadyPresent);
        }
        this._callbackIfExistsAsync = callback;
        this._eventWatcher.subscribe(this._onEventWatcherCallbackAsync.bind(this));
    }
    /**
     * Ends an orderStateWatcher subscription.
     */
    public unsubscribe(): void {
        delete this._callbackIfExistsAsync;
        this._eventWatcher.unsubscribe();
    }
    private async _onEventWatcherCallbackAsync(log: LogEvent): Promise<void> {
        const maybeDecodedLog = this._abiDecoder.tryToDecodeLogOrNoop(log);
        const isLogDecoded = !_.isUndefined((maybeDecodedLog as LogWithDecodedArgs<any>).event);
        if (!isLogDecoded) {
            return; // noop
        }
        // Unfortunately blockNumber is returned as a hex-encoded string, so we
        // convert it to a number here.
        const blockNumberBuff = ethUtil.toBuffer(maybeDecodedLog.blockNumber);
        const blockNumber = ethUtil.bufferToInt(blockNumberBuff);

        const decodedLog = maybeDecodedLog as LogWithDecodedArgs<any>;
        let makerToken: string;
        let makerAddress: string;
        let orderHashesSet: Set<string>;
        switch (decodedLog.event) {
            case TokenEvents.Approval:
                makerToken = decodedLog.address;
                makerAddress = decodedLog.args._owner;
                orderHashesSet = _.get(this._dependentOrderHashes, [makerAddress, makerToken]);
                if (!_.isUndefined(orderHashesSet)) {
                    const orderHashes = Array.from(orderHashesSet);
                    await this._emitRevalidateOrdersAsync(orderHashes, blockNumber);
                }
                break;

            case TokenEvents.Transfer:
                makerToken = decodedLog.address;
                makerAddress = decodedLog.args._from;
                orderHashesSet = _.get(this._dependentOrderHashes, [makerAddress, makerToken]);
                if (!_.isUndefined(orderHashesSet)) {
                    const orderHashes = Array.from(orderHashesSet);
                    await this._emitRevalidateOrdersAsync(orderHashes, blockNumber);
                }
                break;

            case ExchangeEvents.LogFill:
            case ExchangeEvents.LogCancel:
                const orderHash = decodedLog.args.orderHash;
                const isOrderWatched = !_.isUndefined(this._orderByOrderHash[orderHash]);
                if (isOrderWatched) {
                    await this._emitRevalidateOrdersAsync([orderHash], blockNumber);
                }
                break;

            case ExchangeEvents.LogError:
                return; // noop

            default:
                throw utils.spawnSwitchErr('decodedLog.event', decodedLog.event);
        }
    }
    private async _emitRevalidateOrdersAsync(orderHashes: string[], blockNumber: number): Promise<void> {
        for (const orderHash of orderHashes) {
            const signedOrder = this._orderByOrderHash[orderHash] as SignedOrder;
            const orderState = await this._orderStateUtils.getOrderStateAsync(signedOrder);
            if (!_.isUndefined(this._callbackIfExistsAsync)) {
                await this._callbackIfExistsAsync(orderState);
            } else {
                break; // Unsubscribe was called
            }
        }
    }
    private addToDependentOrderHashes(signedOrder: SignedOrder, orderHash: string) {
        if (_.isUndefined(this._dependentOrderHashes[signedOrder.maker])) {
            this._dependentOrderHashes[signedOrder.maker] = {};
        }
        if (_.isUndefined(this._dependentOrderHashes[signedOrder.maker][signedOrder.makerTokenAddress])) {
            this._dependentOrderHashes[signedOrder.maker][signedOrder.makerTokenAddress] = new Set();
        }
        this._dependentOrderHashes[signedOrder.maker][signedOrder.makerTokenAddress].add(orderHash);
    }
    private removeFromDependentOrderHashes(makerAddress: string, makerTokenAddress: string, orderHash: string) {
        this._dependentOrderHashes[makerAddress][makerTokenAddress].delete(orderHash);
        if (this._dependentOrderHashes[makerAddress][makerTokenAddress].size === 0) {
            delete this._dependentOrderHashes[makerAddress][makerTokenAddress];
        }
        if (_.isEmpty(this._dependentOrderHashes[makerAddress])) {
            delete this._dependentOrderHashes[makerAddress];
        }
    }
}
