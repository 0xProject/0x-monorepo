// tslint:disable:no-unnecessary-type-assertion
import { ContractAddresses } from '@0x/contract-addresses';
import * as artifacts from '@0x/contract-artifacts';
import {
    AssetBalanceAndProxyAllowanceFetcher,
    ContractWrappers,
    ERC20TokenApprovalEventArgs,
    ERC20TokenEventArgs,
    ERC20TokenEvents,
    ERC20TokenTransferEventArgs,
    ERC721TokenApprovalEventArgs,
    ERC721TokenApprovalForAllEventArgs,
    ERC721TokenEventArgs,
    ERC721TokenEvents,
    ERC721TokenTransferEventArgs,
    ExchangeCancelEventArgs,
    ExchangeCancelUpToEventArgs,
    ExchangeEventArgs,
    ExchangeEvents,
    ExchangeFillEventArgs,
    OrderFilledCancelledFetcher,
    WETH9DepositEventArgs,
    WETH9EventArgs,
    WETH9Events,
    WETH9WithdrawalEventArgs,
} from '@0x/contract-wrappers';
import { schemas } from '@0x/json-schemas';
import {
    assetDataUtils,
    BalanceAndProxyAllowanceLazyStore,
    OrderFilledCancelledLazyStore,
    orderHashUtils,
    OrderStateUtils,
} from '@0x/order-utils';
import { AssetProxyId, ExchangeContractErrs, OrderState, SignedOrder, Stats } from '@0x/types';
import { errorUtils, intervalUtils } from '@0x/utils';
import { BlockParamLiteral, LogEntryEvent, LogWithDecodedArgs, Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { orderWatcherPartialConfigSchema } from '../schemas/order_watcher_partial_config_schema';
import { OnOrderStateChangeCallback, OrderWatcherConfig, OrderWatcherError } from '../types';
import { assert } from '../utils/assert';

import { CollisionResistanceAbiDecoder } from './collision_resistant_abi_decoder';
import { DependentOrderHashesTracker } from './dependent_order_hashes_tracker';
import { EventWatcher } from './event_watcher';
import { ExpirationWatcher } from './expiration_watcher';

const MILLISECONDS_IN_A_SECOND = 1000;

type ContractEventArgs = WETH9EventArgs | ExchangeEventArgs | ERC20TokenEventArgs | ERC721TokenEventArgs;

interface OrderByOrderHash {
    [orderHash: string]: SignedOrder;
}

interface OrderStateByOrderHash {
    [orderHash: string]: OrderState;
}

const DEFAULT_ORDER_WATCHER_CONFIG: OrderWatcherConfig = {
    orderExpirationCheckingIntervalMs: 50,
    eventPollingIntervalMs: 200,
    expirationMarginMs: 0,
    // tslint:disable-next-line:custom-no-magic-numbers
    cleanupJobIntervalMs: 1000 * 60 * 60, // 1h
    isVerbose: true,
};
const STATE_LAYER = BlockParamLiteral.Latest;

/**
 * This class includes all the functionality related to watching a set of orders
 * for potential changes in order validity/fillability. The orderWatcher notifies
 * the subscriber of these changes so that a final decision can be made on whether
 * the order should be deemed invalid.
 */
export class OrderWatcher {
    private readonly _dependentOrderHashesTracker: DependentOrderHashesTracker;
    private readonly _orderStateByOrderHashCache: OrderStateByOrderHash = {};
    private readonly _orderByOrderHash: OrderByOrderHash = {};
    private readonly _eventWatcher: EventWatcher;
    private readonly _provider: Provider;
    private readonly _collisionResistantAbiDecoder: CollisionResistanceAbiDecoder;
    private readonly _expirationWatcher: ExpirationWatcher;
    private readonly _orderStateUtils: OrderStateUtils;
    private readonly _orderFilledCancelledLazyStore: OrderFilledCancelledLazyStore;
    private readonly _balanceAndProxyAllowanceLazyStore: BalanceAndProxyAllowanceLazyStore;
    private readonly _cleanupJobInterval: number;
    private _cleanupJobIntervalIdIfExists?: NodeJS.Timer;
    private _callbackIfExists?: OnOrderStateChangeCallback;
    /**
     * Instantiate a new OrderWatcher
     * @param provider Web3 provider to use for JSON RPC calls
     * @param networkId NetworkId to watch orders on
     * @param contractAddresses Optional contract addresses. Defaults to known
     * addresses based on networkId.
     * @param partialConfig Optional configurations
     */
    constructor(
        provider: Provider,
        networkId: number,
        contractAddresses?: ContractAddresses,
        partialConfig: Partial<OrderWatcherConfig> = DEFAULT_ORDER_WATCHER_CONFIG,
    ) {
        assert.isWeb3Provider('provider', provider);
        assert.isNumber('networkId', networkId);
        assert.doesConformToSchema('partialConfig', partialConfig, orderWatcherPartialConfigSchema);
        const config = {
            ...DEFAULT_ORDER_WATCHER_CONFIG,
            ...partialConfig,
        };

        this._provider = provider;
        this._collisionResistantAbiDecoder = new CollisionResistanceAbiDecoder(
            artifacts.ERC20Token.compilerOutput.abi,
            artifacts.ERC721Token.compilerOutput.abi,
            [artifacts.WETH9.compilerOutput.abi, artifacts.Exchange.compilerOutput.abi],
        );
        const contractWrappers = new ContractWrappers(provider, {
            networkId,
            // Note(albrow): We let the contract-wrappers package handle
            // default values for contractAddresses.
            contractAddresses,
        });
        this._eventWatcher = new EventWatcher(provider, config.eventPollingIntervalMs, STATE_LAYER, config.isVerbose);
        const balanceAndProxyAllowanceFetcher = new AssetBalanceAndProxyAllowanceFetcher(
            contractWrappers.erc20Token,
            contractWrappers.erc721Token,
            STATE_LAYER,
        );
        this._balanceAndProxyAllowanceLazyStore = new BalanceAndProxyAllowanceLazyStore(
            balanceAndProxyAllowanceFetcher,
        );
        const orderFilledCancelledFetcher = new OrderFilledCancelledFetcher(contractWrappers.exchange, STATE_LAYER);
        this._orderFilledCancelledLazyStore = new OrderFilledCancelledLazyStore(orderFilledCancelledFetcher);
        this._orderStateUtils = new OrderStateUtils(balanceAndProxyAllowanceFetcher, orderFilledCancelledFetcher);
        const expirationMarginIfExistsMs = _.isUndefined(config) ? undefined : config.expirationMarginMs;
        this._expirationWatcher = new ExpirationWatcher(
            expirationMarginIfExistsMs,
            config.orderExpirationCheckingIntervalMs,
        );
        this._cleanupJobInterval = config.cleanupJobIntervalMs;
        const zrxTokenAddress = assetDataUtils.decodeERC20AssetData(orderFilledCancelledFetcher.getZRXAssetData())
            .tokenAddress;
        this._dependentOrderHashesTracker = new DependentOrderHashesTracker(zrxTokenAddress);
    }
    /**
     * Add an order to the orderWatcher. Before the order is added, it's
     * signature is verified.
     * @param   signedOrder     The order you wish to start watching.
     */
    public async addOrderAsync(signedOrder: SignedOrder): Promise<void> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        await assert.isValidSignatureAsync(this._provider, orderHash, signedOrder.signature, signedOrder.makerAddress);

        const expirationUnixTimestampMs = signedOrder.expirationTimeSeconds.times(MILLISECONDS_IN_A_SECOND);
        this._expirationWatcher.addOrder(orderHash, expirationUnixTimestampMs);

        this._orderByOrderHash[orderHash] = signedOrder;
        this._dependentOrderHashesTracker.addToDependentOrderHashes(signedOrder);

        const orderAssetDatas = [signedOrder.makerAssetData, signedOrder.takerAssetData];
        _.each(orderAssetDatas, assetData => {
            const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(assetData);
            if (decodedAssetData.assetProxyId === AssetProxyId.ERC20) {
                this._collisionResistantAbiDecoder.addERC20Token(decodedAssetData.tokenAddress);
            } else if (decodedAssetData.assetProxyId === AssetProxyId.ERC721) {
                this._collisionResistantAbiDecoder.addERC721Token(decodedAssetData.tokenAddress);
            }
        });
    }
    /**
     * Removes an order from the orderWatcher
     * @param   orderHash     The orderHash of the order you wish to stop watching.
     */
    public removeOrder(orderHash: string): void {
        assert.doesConformToSchema('orderHash', orderHash, schemas.orderHashSchema);
        const signedOrder = this._orderByOrderHash[orderHash];
        if (_.isUndefined(signedOrder)) {
            return; // noop
        }
        this._dependentOrderHashesTracker.removeFromDependentOrderHashes(signedOrder);
        delete this._orderByOrderHash[orderHash];
        this._expirationWatcher.removeOrder(orderHash);
        delete this._orderStateByOrderHashCache[orderHash];
    }
    /**
     * Starts an orderWatcher subscription. The callback will be called every time a watched order's
     * backing blockchain state has changed. This is a call-to-action for the caller to re-validate the order.
     * @param   callback            Receives the orderHash of the order that should be re-validated, together
     *                              with all the order-relevant blockchain state needed to re-validate the order.
     */
    public subscribe(callback: OnOrderStateChangeCallback): void {
        assert.isFunction('callback', callback);
        if (!_.isUndefined(this._callbackIfExists)) {
            throw new Error(OrderWatcherError.SubscriptionAlreadyPresent);
        }
        this._callbackIfExists = callback;
        this._eventWatcher.subscribe(this._onEventWatcherCallbackAsync.bind(this));
        this._expirationWatcher.subscribe(this._onOrderExpired.bind(this));
        this._cleanupJobIntervalIdIfExists = intervalUtils.setAsyncExcludingInterval(
            this._cleanupAsync.bind(this),
            this._cleanupJobInterval,
            (err: Error) => {
                this.unsubscribe();
                callback(err);
            },
        );
    }
    /**
     * Ends an orderWatcher subscription.
     */
    public unsubscribe(): void {
        if (_.isUndefined(this._callbackIfExists) || _.isUndefined(this._cleanupJobIntervalIdIfExists)) {
            throw new Error(OrderWatcherError.SubscriptionNotFound);
        }
        this._balanceAndProxyAllowanceLazyStore.deleteAll();
        this._orderFilledCancelledLazyStore.deleteAll();
        delete this._callbackIfExists;
        this._eventWatcher.unsubscribe();
        this._expirationWatcher.unsubscribe();
        intervalUtils.clearAsyncExcludingInterval(this._cleanupJobIntervalIdIfExists);
    }
    /**
     * Gets statistics of the OrderWatcher Instance.
     */
    public getStats(): Stats {
        return {
            orderCount: _.size(this._orderByOrderHash),
        };
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
        this._orderFilledCancelledLazyStore.deleteIsCancelled(orderHash);

        this._balanceAndProxyAllowanceLazyStore.deleteBalance(signedOrder.makerAssetData, signedOrder.makerAddress);
        this._balanceAndProxyAllowanceLazyStore.deleteProxyAllowance(
            signedOrder.makerAssetData,
            signedOrder.makerAddress,
        );
        this._balanceAndProxyAllowanceLazyStore.deleteBalance(signedOrder.takerAssetData, signedOrder.takerAddress);
        this._balanceAndProxyAllowanceLazyStore.deleteProxyAllowance(
            signedOrder.takerAssetData,
            signedOrder.takerAddress,
        );

        const zrxAssetData = this._orderFilledCancelledLazyStore.getZRXAssetData();
        if (!signedOrder.makerFee.isZero()) {
            this._balanceAndProxyAllowanceLazyStore.deleteBalance(zrxAssetData, signedOrder.makerAddress);
            this._balanceAndProxyAllowanceLazyStore.deleteProxyAllowance(zrxAssetData, signedOrder.makerAddress);
        }
        if (!signedOrder.takerFee.isZero()) {
            this._balanceAndProxyAllowanceLazyStore.deleteBalance(zrxAssetData, signedOrder.takerAddress);
            this._balanceAndProxyAllowanceLazyStore.deleteProxyAllowance(zrxAssetData, signedOrder.takerAddress);
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
                this._callbackIfExists(null, orderState);
            }
        }
    }
    private async _onEventWatcherCallbackAsync(err: Error | null, logIfExists?: LogEntryEvent): Promise<void> {
        if (!_.isNull(err)) {
            if (!_.isUndefined(this._callbackIfExists)) {
                this._callbackIfExists(err);
            }
            return;
        }
        const maybeDecodedLog = this._collisionResistantAbiDecoder.tryToDecodeLogOrNoop<ContractEventArgs>(
            // At this moment we are sure that no error occured and log is defined.
            logIfExists as LogEntryEvent,
        );
        const isLogDecoded = !_.isUndefined(((maybeDecodedLog as any) as LogWithDecodedArgs<ContractEventArgs>).event);
        if (!isLogDecoded) {
            return; // noop
        }
        const decodedLog = (maybeDecodedLog as any) as LogWithDecodedArgs<ContractEventArgs>;
        const transactionHash = decodedLog.transactionHash;
        switch (decodedLog.event) {
            case ERC20TokenEvents.Approval:
            case ERC721TokenEvents.Approval: {
                // ERC20 and ERC721 Transfer events have the same name so we need to distinguish them by args
                if (!_.isUndefined(decodedLog.args._value)) {
                    // ERC20
                    // Invalidate cache
                    const args = decodedLog.args as ERC20TokenApprovalEventArgs;
                    const tokenAssetData = assetDataUtils.encodeERC20AssetData(decodedLog.address);
                    this._balanceAndProxyAllowanceLazyStore.deleteProxyAllowance(tokenAssetData, args._owner);
                    // Revalidate orders
                    const orderHashes = this._dependentOrderHashesTracker.getDependentOrderHashesByAssetDataByMaker(
                        args._owner,
                        tokenAssetData,
                    );
                    await this._emitRevalidateOrdersAsync(orderHashes, transactionHash);
                    break;
                } else {
                    // ERC721
                    // Invalidate cache
                    const args = decodedLog.args as ERC721TokenApprovalEventArgs;
                    const tokenAssetData = assetDataUtils.encodeERC721AssetData(decodedLog.address, args._tokenId);
                    this._balanceAndProxyAllowanceLazyStore.deleteProxyAllowance(tokenAssetData, args._owner);
                    // Revalidate orders
                    const orderHashes = this._dependentOrderHashesTracker.getDependentOrderHashesByAssetDataByMaker(
                        args._owner,
                        tokenAssetData,
                    );
                    await this._emitRevalidateOrdersAsync(orderHashes, transactionHash);
                    break;
                }
            }
            case ERC20TokenEvents.Transfer:
            case ERC721TokenEvents.Transfer: {
                // ERC20 and ERC721 Transfer events have the same name so we need to distinguish them by args
                if (!_.isUndefined(decodedLog.args._value)) {
                    // ERC20
                    // Invalidate cache
                    const args = decodedLog.args as ERC20TokenTransferEventArgs;
                    const tokenAssetData = assetDataUtils.encodeERC20AssetData(decodedLog.address);
                    this._balanceAndProxyAllowanceLazyStore.deleteBalance(tokenAssetData, args._from);
                    this._balanceAndProxyAllowanceLazyStore.deleteBalance(tokenAssetData, args._to);
                    // Revalidate orders
                    const orderHashes = this._dependentOrderHashesTracker.getDependentOrderHashesByAssetDataByMaker(
                        args._from,
                        tokenAssetData,
                    );
                    await this._emitRevalidateOrdersAsync(orderHashes, transactionHash);
                    break;
                } else {
                    // ERC721
                    // Invalidate cache
                    const args = decodedLog.args as ERC721TokenTransferEventArgs;
                    const tokenAssetData = assetDataUtils.encodeERC721AssetData(decodedLog.address, args._tokenId);
                    this._balanceAndProxyAllowanceLazyStore.deleteBalance(tokenAssetData, args._from);
                    this._balanceAndProxyAllowanceLazyStore.deleteBalance(tokenAssetData, args._to);
                    // Revalidate orders
                    const orderHashes = this._dependentOrderHashesTracker.getDependentOrderHashesByAssetDataByMaker(
                        args._from,
                        tokenAssetData,
                    );
                    await this._emitRevalidateOrdersAsync(orderHashes, transactionHash);
                    break;
                }
            }
            case ERC721TokenEvents.ApprovalForAll: {
                // Invalidate cache
                const args = decodedLog.args as ERC721TokenApprovalForAllEventArgs;
                const tokenAddress = decodedLog.address;
                this._balanceAndProxyAllowanceLazyStore.deleteAllERC721ProxyAllowance(tokenAddress, args._owner);
                // Revalidate orders
                const orderHashes = this._dependentOrderHashesTracker.getDependentOrderHashesByERC721ByMaker(
                    args._owner,
                    tokenAddress,
                );
                await this._emitRevalidateOrdersAsync(orderHashes, transactionHash);
                break;
            }
            case WETH9Events.Deposit: {
                // Invalidate cache
                const args = decodedLog.args as WETH9DepositEventArgs;
                const tokenAssetData = assetDataUtils.encodeERC20AssetData(decodedLog.address);
                this._balanceAndProxyAllowanceLazyStore.deleteBalance(tokenAssetData, args._owner);
                // Revalidate orders
                const orderHashes = this._dependentOrderHashesTracker.getDependentOrderHashesByAssetDataByMaker(
                    args._owner,
                    tokenAssetData,
                );
                await this._emitRevalidateOrdersAsync(orderHashes, transactionHash);
                break;
            }
            case WETH9Events.Withdrawal: {
                // Invalidate cache
                const args = decodedLog.args as WETH9WithdrawalEventArgs;
                const tokenAssetData = assetDataUtils.encodeERC20AssetData(decodedLog.address);
                this._balanceAndProxyAllowanceLazyStore.deleteBalance(tokenAssetData, args._owner);
                // Revalidate orders
                const orderHashes = this._dependentOrderHashesTracker.getDependentOrderHashesByAssetDataByMaker(
                    args._owner,
                    tokenAssetData,
                );
                await this._emitRevalidateOrdersAsync(orderHashes, transactionHash);
                break;
            }
            case ExchangeEvents.Fill: {
                // Invalidate cache
                const args = decodedLog.args as ExchangeFillEventArgs;
                this._orderFilledCancelledLazyStore.deleteFilledTakerAmount(args.orderHash);
                // Revalidate orders
                const orderHash = args.orderHash;
                const isOrderWatched = !_.isUndefined(this._orderByOrderHash[orderHash]);
                if (isOrderWatched) {
                    await this._emitRevalidateOrdersAsync([orderHash], transactionHash);
                }
                break;
            }
            case ExchangeEvents.Cancel: {
                // Invalidate cache
                const args = decodedLog.args as ExchangeCancelEventArgs;
                this._orderFilledCancelledLazyStore.deleteIsCancelled(args.orderHash);
                // Revalidate orders
                const orderHash = args.orderHash;
                const isOrderWatched = !_.isUndefined(this._orderByOrderHash[orderHash]);
                if (isOrderWatched) {
                    await this._emitRevalidateOrdersAsync([orderHash], transactionHash);
                }
                break;
            }
            case ExchangeEvents.CancelUpTo: {
                // TODO(logvinov): Do it smarter and actually look at the salt and order epoch
                // Invalidate cache
                const args = decodedLog.args as ExchangeCancelUpToEventArgs;
                this._orderFilledCancelledLazyStore.deleteAllIsCancelled();
                // Revalidate orders
                const orderHashes = this._dependentOrderHashesTracker.getDependentOrderHashesByMaker(args.makerAddress);
                await this._emitRevalidateOrdersAsync(orderHashes, transactionHash);
                break;
            }

            default:
                throw errorUtils.spawnSwitchErr('decodedLog.event', decodedLog.event);
        }
    }
    private async _emitRevalidateOrdersAsync(orderHashes: string[], transactionHash?: string): Promise<void> {
        for (const orderHash of orderHashes) {
            const signedOrder = this._orderByOrderHash[orderHash];
            // Most of these calls will never reach the network because the data is fetched from stores
            // and only updated when cache is invalidated
            const orderState = await this._orderStateUtils.getOpenOrderStateAsync(signedOrder, transactionHash);
            if (_.isUndefined(this._callbackIfExists)) {
                break; // Unsubscribe was called
            }
            if (_.isEqual(orderState, this._orderStateByOrderHashCache[orderHash])) {
                // Actual order state didn't change
                continue;
            } else {
                this._orderStateByOrderHashCache[orderHash] = orderState;
            }
            this._callbackIfExists(null, orderState);
        }
    }
}
