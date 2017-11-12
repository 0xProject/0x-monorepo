import * as _ from 'lodash';
import {schemas} from '0x-json-schemas';
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
    ContractEventArgs,
    OnOrderStateChangeCallback,
    OrderStateWatcherConfig,
    ApprovalContractEventArgs,
    TransferContractEventArgs,
    LogFillContractEventArgs,
    LogCancelContractEventArgs,
    ExchangeEvents,
    TokenEvents,
    ZeroExError,
} from '../types';
import {Web3Wrapper} from '../web3_wrapper';
import {BlockStore} from '../stores/block_store';
import {TokenWrapper} from '../contract_wrappers/token_wrapper';
import {ExchangeWrapper} from '../contract_wrappers/exchange_wrapper';
import {OrderFilledCancelledLazyStore} from '../stores/order_filled_cancelled_lazy_store';
import {BalanceAndProxyAllowanceLazyStore} from '../stores/balance_proxy_allowance_lazy_store';

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
    private _callbackIfExistsAsync?: OnOrderStateChangeCallback;
    private _eventWatcher: EventWatcher;
    private _web3Wrapper: Web3Wrapper;
    private _token: TokenWrapper;
    private _exchange: ExchangeWrapper;
    private _abiDecoder: AbiDecoder;
    private _orderStateUtils: OrderStateUtils;
    private _blockStore: BlockStore;
    private _orderFilledCancelledLazyStore: OrderFilledCancelledLazyStore;
    private _balanceAndProxyAllowanceLazyStore: BalanceAndProxyAllowanceLazyStore;
    constructor(
        web3Wrapper: Web3Wrapper, abiDecoder: AbiDecoder, token: TokenWrapper, exchange: ExchangeWrapper,
        config?: OrderStateWatcherConfig,
    ) {
        this._orderByOrderHash = {};
        this._abiDecoder = abiDecoder;
        this._token = token;
        this._exchange = exchange;
        this._web3Wrapper = web3Wrapper;
        this._dependentOrderHashes = {};
        const eventPollingIntervalMs = _.isUndefined(config) ? undefined : config.eventPollingIntervalMs;
        const blockPollingIntervalMs = _.isUndefined(config) ? undefined : config.blockPollingIntervalMs;
        const numConfirmations = (_.isUndefined(config) || _.isUndefined(config.numConfirmations)) ?
                                 DEFAULT_NUM_CONFIRMATIONS :
                                 config.numConfirmations;
        this._blockStore = new BlockStore(numConfirmations, this._web3Wrapper, blockPollingIntervalMs);
        this._eventWatcher = new EventWatcher(
            web3Wrapper, this._blockStore, eventPollingIntervalMs,
        );
        this._balanceAndProxyAllowanceLazyStore = new BalanceAndProxyAllowanceLazyStore(
            this._token, this._blockStore,
        );
        this._orderFilledCancelledLazyStore = new OrderFilledCancelledLazyStore(
            this._exchange, this._blockStore,
        );
        this._orderStateUtils = new OrderStateUtils(
            this._balanceAndProxyAllowanceLazyStore, this._orderFilledCancelledLazyStore,
        );
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
    public async subscribeAsync(callback: OnOrderStateChangeCallback): Promise<void> {
        assert.isFunction('callback', callback);
        if (!_.isUndefined(this._callbackIfExistsAsync)) {
            throw new Error(ZeroExError.SubscriptionAlreadyPresent);
        }
        await this._blockStore.startAsync();
        this._callbackIfExistsAsync = callback;
        this._eventWatcher.subscribe(this._onEventWatcherCallbackAsync.bind(this));
    }
    /**
     * Ends an orderStateWatcher subscription.
     */
    public unsubscribe(): void {
        if (_.isUndefined(this._callbackIfExistsAsync)) {
            throw new Error(ZeroExError.SubscriptionNotFound);
        }
        this._blockStore.stop();
        this._balanceAndProxyAllowanceLazyStore.deleteAll();
        this._orderFilledCancelledLazyStore.deleteAll();
        delete this._callbackIfExistsAsync;
        this._eventWatcher.unsubscribe();
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
        let orderHashesSet: Set<string>;
        switch (decodedLog.event) {
            case TokenEvents.Approval:
            {
                // Invalidate cache
                const args = decodedLog.args as ApprovalContractEventArgs;
                this._balanceAndProxyAllowanceLazyStore.deleteProxyAllowance(decodedLog.address, args._owner);
                // Revalidate orders
                makerToken = decodedLog.address;
                makerAddress = args._owner;
                orderHashesSet = _.get(this._dependentOrderHashes, [makerAddress, makerToken]);
                if (!_.isUndefined(orderHashesSet)) {
                    const orderHashes = Array.from(orderHashesSet);
                    await this._emitRevalidateOrdersAsync(orderHashes);
                }
                break;
            }
            case TokenEvents.Transfer:
            {
                // Invalidate cache
                const args = decodedLog.args as TransferContractEventArgs;
                this._balanceAndProxyAllowanceLazyStore.deleteBalance(decodedLog.address, args._from);
                this._balanceAndProxyAllowanceLazyStore.deleteBalance(decodedLog.address, args._to);
                // Revalidate orders
                makerToken = decodedLog.address;
                makerAddress = args._from;
                orderHashesSet = _.get(this._dependentOrderHashes, [makerAddress, makerToken]);
                if (!_.isUndefined(orderHashesSet)) {
                    const orderHashes = Array.from(orderHashesSet);
                    await this._emitRevalidateOrdersAsync(orderHashes);
                }
                break;
            }
            case ExchangeEvents.LogFill:
            {
                // Invalidate cache
                const args = decodedLog.args as LogFillContractEventArgs;
                this._orderFilledCancelledLazyStore.deleteFilledTakerAmount(args.orderHash);
                this._orderFilledCancelledLazyStore.deleteFilledTakerAmount(args.orderHash);
                // Revalidate orders
                const orderHash = args.orderHash;
                const isOrderWatched = !_.isUndefined(this._orderByOrderHash[orderHash]);
                if (isOrderWatched) {
                    await this._emitRevalidateOrdersAsync([orderHash]);
                }
                break;
            }
            case ExchangeEvents.LogCancel:
            {
                // Invalidate cache
                const args = decodedLog.args as LogCancelContractEventArgs;
                this._orderFilledCancelledLazyStore.deleteCancelledTakerAmount(args.orderHash);
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
            const signedOrder = this._orderByOrderHash[orderHash] as SignedOrder;
            const orderState = await this._orderStateUtils.getOrderStateAsync(signedOrder);
            if (_.isUndefined(this._callbackIfExistsAsync)) {
                break; // Unsubscribe was called
            }
            await this._callbackIfExistsAsync(orderState);
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
