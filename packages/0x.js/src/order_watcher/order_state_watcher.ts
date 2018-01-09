import { schemas } from '@0xproject/json-schemas';
import { intervalUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { ZeroEx } from '../0x';
import { ExchangeWrapper } from '../contract_wrappers/exchange_wrapper';
import { TokenWrapper } from '../contract_wrappers/token_wrapper';
import { BalanceAndProxyAllowanceLazyStore } from '../stores/balance_proxy_allowance_lazy_store';
import { OrderFilledCancelledLazyStore } from '../stores/order_filled_cancelled_lazy_store';
import {
    ApprovalContractEventArgs,
    BlockParamLiteral,
    ContractEventArgs,
    DepositContractEventArgs,
    EtherTokenEvents,
    ExchangeContractErrs,
    ExchangeEvents,
    LogCancelContractEventArgs,
    LogEvent,
    LogFillContractEventArgs,
    LogWithDecodedArgs,
    OnOrderStateChangeCallback,
    OrderState,
    OrderStateWatcherConfig,
    SignedOrder,
    TokenEvents,
    TransferContractEventArgs,
    WithdrawalContractEventArgs,
    ZeroExError,
} from '../types';
import { AbiDecoder } from '../utils/abi_decoder';
import { assert } from '../utils/assert';
import { OrderStateUtils } from '../utils/order_state_utils';
import { utils } from '../utils/utils';

import { EventWatcher } from './event_watcher';
import { ExpirationWatcher } from './expiration_watcher';

interface DependentOrderHashes {
    [makerAddress: string]: {
        [makerToken: string]: Set<string>;
    };
}

interface OrderByOrderHash {
    [orderHash: string]: SignedOrder;
}

interface OrderStateByOrderHash {
    [orderHash: string]: OrderState;
}

const DEFAULT_CLEANUP_JOB_INTERVAL_MS = 1000 * 60 * 60; // 1h

/**
 * This class includes all the functionality related to watching a set of orders
 * for potential changes in order validity/fillability. The orderWatcher notifies
 * the subscriber of these changes so that a final decison can be made on whether
 * the order should be deemed invalid.
 */
export class OrderStateWatcher {
    private _orderStateByOrderHashCache: OrderStateByOrderHash = {};
    private _orderByOrderHash: OrderByOrderHash = {};
    private _dependentOrderHashes: DependentOrderHashes = {};
    private _callbackIfExists?: OnOrderStateChangeCallback;
    private _eventWatcher: EventWatcher;
    private _web3Wrapper: Web3Wrapper;
    private _abiDecoder: AbiDecoder;
    private _expirationWatcher: ExpirationWatcher;
    private _orderStateUtils: OrderStateUtils;
    private _orderFilledCancelledLazyStore: OrderFilledCancelledLazyStore;
    private _balanceAndProxyAllowanceLazyStore: BalanceAndProxyAllowanceLazyStore;
    private _cleanupJobInterval: number;
    private _cleanupJobIntervalIdIfExists?: NodeJS.Timer;
    constructor(
        web3Wrapper: Web3Wrapper,
        abiDecoder: AbiDecoder,
        token: TokenWrapper,
        exchange: ExchangeWrapper,
        config?: OrderStateWatcherConfig,
    ) {
        this._abiDecoder = abiDecoder;
        this._web3Wrapper = web3Wrapper;
        const pollingIntervalIfExistsMs = _.isUndefined(config) ? undefined : config.eventPollingIntervalMs;
        this._eventWatcher = new EventWatcher(web3Wrapper, pollingIntervalIfExistsMs);
        this._balanceAndProxyAllowanceLazyStore = new BalanceAndProxyAllowanceLazyStore(
            token,
            BlockParamLiteral.Pending,
        );
        this._orderFilledCancelledLazyStore = new OrderFilledCancelledLazyStore(exchange);
        this._orderStateUtils = new OrderStateUtils(
            this._balanceAndProxyAllowanceLazyStore,
            this._orderFilledCancelledLazyStore,
        );
        const orderExpirationCheckingIntervalMsIfExists = _.isUndefined(config)
            ? undefined
            : config.orderExpirationCheckingIntervalMs;
        const expirationMarginIfExistsMs = _.isUndefined(config) ? undefined : config.expirationMarginMs;
        this._expirationWatcher = new ExpirationWatcher(
            expirationMarginIfExistsMs,
            orderExpirationCheckingIntervalMsIfExists,
        );
        this._cleanupJobInterval =
            _.isUndefined(config) || _.isUndefined(config.cleanupJobIntervalMs)
                ? DEFAULT_CLEANUP_JOB_INTERVAL_MS
                : config.cleanupJobIntervalMs;
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
        this._addToDependentOrderHashes(signedOrder, orderHash);
        const expirationUnixTimestampMs = signedOrder.expirationUnixTimestampSec.times(1000);
        this._expirationWatcher.addOrder(orderHash, expirationUnixTimestampMs);
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
        delete this._orderStateByOrderHashCache[orderHash];
        const exchange = (this._orderFilledCancelledLazyStore as any)._exchange as ExchangeWrapper;
        const zrxTokenAddress = exchange.getZRXTokenAddress();
        this._removeFromDependentOrderHashes(signedOrder.maker, zrxTokenAddress, orderHash);
        this._removeFromDependentOrderHashes(signedOrder.maker, signedOrder.makerTokenAddress, orderHash);
        this._expirationWatcher.removeOrder(orderHash);
    }
    /**
     * Starts an orderStateWatcher subscription. The callback will be called every time a watched order's
     * backing blockchain state has changed. This is a call-to-action for the caller to re-validate the order.
     * @param   callback            Receives the orderHash of the order that should be re-validated, together
     *                              with all the order-relevant blockchain state needed to re-validate the order.
     */
    public subscribe(callback: OnOrderStateChangeCallback): void {
        assert.isFunction('callback', callback);
        if (!_.isUndefined(this._callbackIfExists)) {
            throw new Error(ZeroExError.SubscriptionAlreadyPresent);
        }
        this._callbackIfExists = callback;
        this._eventWatcher.subscribe(this._onEventWatcherCallbackAsync.bind(this));
        this._expirationWatcher.subscribe(this._onOrderExpired.bind(this));
        this._cleanupJobIntervalIdIfExists = intervalUtils.setAsyncExcludingInterval(
            this._cleanupAsync.bind(this),
            this._cleanupJobInterval,
        );
    }
    /**
     * Ends an orderStateWatcher subscription.
     */
    public unsubscribe(): void {
        if (_.isUndefined(this._callbackIfExists) || _.isUndefined(this._cleanupJobIntervalIdIfExists)) {
            throw new Error(ZeroExError.SubscriptionNotFound);
        }
        this._balanceAndProxyAllowanceLazyStore.deleteAll();
        this._orderFilledCancelledLazyStore.deleteAll();
        delete this._callbackIfExists;
        this._eventWatcher.unsubscribe();
        this._expirationWatcher.unsubscribe();
        intervalUtils.clearAsyncExcludingInterval(this._cleanupJobIntervalIdIfExists);
    }
    private async _cleanupAsync(): Promise<void> {
        for (const orderHash of _.keys(this._orderByOrderHash)) {
            this._cleanupOrderRelatedState(orderHash);
            await this._emitRevalidateOrdersAsync([orderHash]);
        }
    }
    private _cleanupOrderRelatedState(orderHash: string): void {
        const signedOrder = this._orderByOrderHash[orderHash];

        this._orderFilledCancelledLazyStore.deleteFilledTakerAmount(orderHash);
        this._orderFilledCancelledLazyStore.deleteCancelledTakerAmount(orderHash);

        this._balanceAndProxyAllowanceLazyStore.deleteBalance(signedOrder.makerTokenAddress, signedOrder.maker);
        this._balanceAndProxyAllowanceLazyStore.deleteProxyAllowance(signedOrder.makerTokenAddress, signedOrder.maker);
        this._balanceAndProxyAllowanceLazyStore.deleteBalance(signedOrder.takerTokenAddress, signedOrder.taker);
        this._balanceAndProxyAllowanceLazyStore.deleteProxyAllowance(signedOrder.takerTokenAddress, signedOrder.taker);

        const zrxTokenAddress = this._getZRXTokenAddress();
        if (!signedOrder.makerFee.isZero()) {
            this._balanceAndProxyAllowanceLazyStore.deleteBalance(zrxTokenAddress, signedOrder.maker);
            this._balanceAndProxyAllowanceLazyStore.deleteProxyAllowance(zrxTokenAddress, signedOrder.maker);
        }
        if (!signedOrder.takerFee.isZero()) {
            this._balanceAndProxyAllowanceLazyStore.deleteBalance(zrxTokenAddress, signedOrder.taker);
            this._balanceAndProxyAllowanceLazyStore.deleteProxyAllowance(zrxTokenAddress, signedOrder.taker);
        }
    }
    private _onOrderExpired(orderHash: string): void {
        const orderState: OrderState = {
            isValid: false,
            orderHash,
            error: ExchangeContractErrs.OrderFillExpired,
        };
        if (!_.isUndefined(this._orderByOrderHash[orderHash])) {
            this.removeOrder(orderHash);
            if (!_.isUndefined(this._callbackIfExists)) {
                this._callbackIfExists(orderState);
            }
        }
    }
    private async _onEventWatcherCallbackAsync(log: LogEvent): Promise<void> {
        const maybeDecodedLog = this._abiDecoder.tryToDecodeLogOrNoop(log);
        const isLogDecoded = !_.isUndefined((maybeDecodedLog as LogWithDecodedArgs<any>).event);
        if (!isLogDecoded) {
            return; // noop
        }
        const decodedLog = maybeDecodedLog as LogWithDecodedArgs<ContractEventArgs>;
        let makerToken: string;
        let makerAddress: string;
        switch (decodedLog.event) {
            case TokenEvents.Approval: {
                // Invalidate cache
                const args = decodedLog.args as ApprovalContractEventArgs;
                this._balanceAndProxyAllowanceLazyStore.deleteProxyAllowance(decodedLog.address, args._owner);
                // Revalidate orders
                makerToken = decodedLog.address;
                makerAddress = args._owner;
                if (
                    !_.isUndefined(this._dependentOrderHashes[makerAddress]) &&
                    !_.isUndefined(this._dependentOrderHashes[makerAddress][makerToken])
                ) {
                    const orderHashes = Array.from(this._dependentOrderHashes[makerAddress][makerToken]);
                    await this._emitRevalidateOrdersAsync(orderHashes);
                }
                break;
            }
            case TokenEvents.Transfer: {
                // Invalidate cache
                const args = decodedLog.args as TransferContractEventArgs;
                this._balanceAndProxyAllowanceLazyStore.deleteBalance(decodedLog.address, args._from);
                this._balanceAndProxyAllowanceLazyStore.deleteBalance(decodedLog.address, args._to);
                // Revalidate orders
                makerToken = decodedLog.address;
                makerAddress = args._from;
                if (
                    !_.isUndefined(this._dependentOrderHashes[makerAddress]) &&
                    !_.isUndefined(this._dependentOrderHashes[makerAddress][makerToken])
                ) {
                    const orderHashes = Array.from(this._dependentOrderHashes[makerAddress][makerToken]);
                    await this._emitRevalidateOrdersAsync(orderHashes);
                }
                break;
            }
            case EtherTokenEvents.Deposit: {
                // Invalidate cache
                const args = decodedLog.args as DepositContractEventArgs;
                this._balanceAndProxyAllowanceLazyStore.deleteBalance(decodedLog.address, args._owner);
                // Revalidate orders
                makerToken = decodedLog.address;
                makerAddress = args._owner;
                if (
                    !_.isUndefined(this._dependentOrderHashes[makerAddress]) &&
                    !_.isUndefined(this._dependentOrderHashes[makerAddress][makerToken])
                ) {
                    const orderHashes = Array.from(this._dependentOrderHashes[makerAddress][makerToken]);
                    await this._emitRevalidateOrdersAsync(orderHashes);
                }
                break;
            }
            case EtherTokenEvents.Withdrawal: {
                // Invalidate cache
                const args = decodedLog.args as WithdrawalContractEventArgs;
                this._balanceAndProxyAllowanceLazyStore.deleteBalance(decodedLog.address, args._owner);
                // Revalidate orders
                makerToken = decodedLog.address;
                makerAddress = args._owner;
                if (
                    !_.isUndefined(this._dependentOrderHashes[makerAddress]) &&
                    !_.isUndefined(this._dependentOrderHashes[makerAddress][makerToken])
                ) {
                    const orderHashes = Array.from(this._dependentOrderHashes[makerAddress][makerToken]);
                    await this._emitRevalidateOrdersAsync(orderHashes);
                }
                break;
            }
            case ExchangeEvents.LogFill: {
                // Invalidate cache
                const args = decodedLog.args as LogFillContractEventArgs;
                this._orderFilledCancelledLazyStore.deleteFilledTakerAmount(args.orderHash);
                // Revalidate orders
                const orderHash = args.orderHash;
                const isOrderWatched = !_.isUndefined(this._orderByOrderHash[orderHash]);
                if (isOrderWatched) {
                    await this._emitRevalidateOrdersAsync([orderHash]);
                }
                break;
            }
            case ExchangeEvents.LogCancel: {
                // Invalidate cache
                const args = decodedLog.args as LogCancelContractEventArgs;
                this._orderFilledCancelledLazyStore.deleteCancelledTakerAmount(args.orderHash);
                // Revalidate orders
                const orderHash = args.orderHash;
                const isOrderWatched = !_.isUndefined(this._orderByOrderHash[orderHash]);
                if (isOrderWatched) {
                    await this._emitRevalidateOrdersAsync([orderHash]);
                }
                break;
            }
            case ExchangeEvents.LogError:
                return; // noop

            default:
                throw utils.spawnSwitchErr('decodedLog.event', decodedLog.event);
        }
    }
    private async _emitRevalidateOrdersAsync(orderHashes: string[]): Promise<void> {
        for (const orderHash of orderHashes) {
            const signedOrder = this._orderByOrderHash[orderHash];
            // Most of these calls will never reach the network because the data is fetched from stores
            // and only updated when cache is invalidated
            const orderState = await this._orderStateUtils.getOrderStateAsync(signedOrder);
            if (_.isUndefined(this._callbackIfExists)) {
                break; // Unsubscribe was called
            }
            if (_.isEqual(orderState, this._orderStateByOrderHashCache[orderHash])) {
                // Actual order state didn't change
                continue;
            } else {
                this._orderStateByOrderHashCache[orderHash] = orderState;
            }
            this._callbackIfExists(orderState);
        }
    }
    private _addToDependentOrderHashes(signedOrder: SignedOrder, orderHash: string): void {
        if (_.isUndefined(this._dependentOrderHashes[signedOrder.maker])) {
            this._dependentOrderHashes[signedOrder.maker] = {};
        }
        if (_.isUndefined(this._dependentOrderHashes[signedOrder.maker][signedOrder.makerTokenAddress])) {
            this._dependentOrderHashes[signedOrder.maker][signedOrder.makerTokenAddress] = new Set();
        }
        this._dependentOrderHashes[signedOrder.maker][signedOrder.makerTokenAddress].add(orderHash);
        const zrxTokenAddress = this._getZRXTokenAddress();
        if (_.isUndefined(this._dependentOrderHashes[signedOrder.maker][zrxTokenAddress])) {
            this._dependentOrderHashes[signedOrder.maker][zrxTokenAddress] = new Set();
        }
        this._dependentOrderHashes[signedOrder.maker][zrxTokenAddress].add(orderHash);
    }
    private _removeFromDependentOrderHashes(makerAddress: string, tokenAddress: string, orderHash: string) {
        this._dependentOrderHashes[makerAddress][tokenAddress].delete(orderHash);
        if (this._dependentOrderHashes[makerAddress][tokenAddress].size === 0) {
            delete this._dependentOrderHashes[makerAddress][tokenAddress];
        }
        if (_.isEmpty(this._dependentOrderHashes[makerAddress])) {
            delete this._dependentOrderHashes[makerAddress];
        }
    }
    private _getZRXTokenAddress(): string {
        const exchange = (this._orderFilledCancelledLazyStore as any)._exchange as ExchangeWrapper;
        const zrxTokenAddress = exchange.getZRXTokenAddress();
        return zrxTokenAddress;
    }
}
