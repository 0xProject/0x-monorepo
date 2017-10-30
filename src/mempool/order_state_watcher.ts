import * as _ from 'lodash';
import {schemas} from '0x-json-schemas';
import {ZeroEx} from '../';
import {EventWatcher} from './event_watcher';
import {assert} from '../utils/assert';
import {artifacts} from '../artifacts';
import {AbiDecoder} from '../utils/abi_decoder';
import {orderWatcherConfigSchema} from '../schemas/order_watcher_config_schema';
import {
    LogEvent,
    SignedOrder,
    Web3Provider,
    LogWithDecodedArgs,
    OrderWatcherConfig,
    OnOrderStateChangeCallback,
} from '../types';
import {Web3Wrapper} from '../web3_wrapper';

export class OrderStateWatcher {
    private _orders = new Map<string, SignedOrder>();
    private _web3Wrapper: Web3Wrapper;
    private _config: OrderWatcherConfig;
    private _callback?: OnOrderStateChangeCallback;
    private _eventWatcher?: EventWatcher;
    private _abiDecoder: AbiDecoder;
    constructor(provider: Web3Provider, config?: OrderWatcherConfig) {
        assert.isWeb3Provider('provider', provider);
        if (!_.isUndefined(config)) {
            assert.doesConformToSchema('config', config, orderWatcherConfigSchema);
        }
        this._web3Wrapper = new Web3Wrapper(provider);
        this._config = config || {};
        const artifactJSONs = _.values(artifacts);
        const abiArrays = _.map(artifactJSONs, artifact => artifact.abi);
        this._abiDecoder = new AbiDecoder(abiArrays);
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
        this._callback = callback;
        this._eventWatcher = new EventWatcher(
            this._web3Wrapper, this._config.mempoolPollingIntervalMs,
        );
        this._eventWatcher.subscribe(this._onMempoolEventCallbackAsync.bind(this));
    }
    public unsubscribe(): void {
        delete this._callback;
        if (!_.isUndefined(this._eventWatcher)) {
            this._eventWatcher.unsubscribe();
        }
    }
    private async _onMempoolEventCallbackAsync(log: LogEvent): Promise<void> {
        const maybeDecodedLog = this._abiDecoder.tryToDecodeLogOrNoop(log);
        if (!_.isUndefined((maybeDecodedLog as LogWithDecodedArgs<any>).event)) {
            await this._revalidateOrdersAsync();
        }
    }
    private async _revalidateOrdersAsync(): Promise<void> {
        _.noop();
    }
}
