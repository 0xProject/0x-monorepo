import { Order, SignedOrder, ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as express from 'express';
import * as _ from 'lodash';

// HACK: web3 injects XMLHttpRequest into the global scope and ProviderEngine checks XMLHttpRequest
// to know whether it is running in a browser or node environment. We need it to be undefined since
// we are not running in a browser env.
// Filed issue: https://github.com/ethereum/web3.js/issues/844
(global as any).XMLHttpRequest = undefined;

import ProviderEngine = require('web3-provider-engine');
import HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet');
import NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import { configs } from './configs';
import { EtherRequestQueue } from './ether_request_queue';
import { idManagement } from './id_management';
import { RequestQueue } from './request_queue';
import { rpcUrls } from './rpc_urls';
import { utils } from './utils';
import { ZRXRequestQueue } from './zrx_request_queue';

// HACK: web3 leaks XMLHttpRequest into the global scope and causes requests to hang
// because they are using the wrong XHR package.
// Filed issue: https://github.com/ethereum/web3.js/issues/844
// tslint:disable-next-line:ordered-imports
import * as Web3 from 'web3';

interface ItemByNetworkId<T> {
    [networkId: string]: T;
}

enum RequestedAssetType {
    ETH = 'ETH',
    WETH = 'WETH',
    ZRX = 'ZRX',
}

const TWO_DAYS_IN_MS = 1.728e8; // TODO: make this configurable

export class Handler {
    private _zeroExByNetworkId: ItemByNetworkId<ZeroEx> = {};
    private _etherRequestQueueByNetworkId: ItemByNetworkId<RequestQueue> = {};
    private _zrxRequestQueueByNetworkId: ItemByNetworkId<RequestQueue> = {};
    constructor() {
        _.forIn(rpcUrls, (rpcUrl: string, networkId: string) => {
            const providerObj = this._createProviderEngine(rpcUrl);
            const web3 = new Web3(providerObj);
            const zeroExConfig = {
                networkId: +networkId,
            };
            const zeroEx = new ZeroEx(web3.currentProvider, zeroExConfig);
            this._zeroExByNetworkId[networkId] = zeroEx;
            this._etherRequestQueueByNetworkId[networkId] = new EtherRequestQueue(web3);
            this._zrxRequestQueueByNetworkId[networkId] = new ZRXRequestQueue(web3, zeroEx);
        });
    }
    public getQueueInfo(req: express.Request, res: express.Response) {
        res.setHeader('Content-Type', 'application/json');
        const queueInfo = _.mapValues(rpcUrls, (rpcUrl: string, networkId: string) => {
            const etherRequestQueue = this._etherRequestQueueByNetworkId[networkId];
            const zrxRequestQueue = this._zrxRequestQueueByNetworkId[networkId];
            return {
                ether: {
                    full: etherRequestQueue.isFull(),
                    size: etherRequestQueue.size(),
                },
                zrx: {
                    full: zrxRequestQueue.isFull(),
                    size: zrxRequestQueue.size(),
                },
            };
        });
        const payload = JSON.stringify(queueInfo);
        res.status(200).send(payload);
    }
    public dispenseEther(req: express.Request, res: express.Response) {
        this._dispenseAsset(req, res, this._etherRequestQueueByNetworkId, RequestedAssetType.ETH);
    }
    public dispenseZRX(req: express.Request, res: express.Response) {
        this._dispenseAsset(req, res, this._zrxRequestQueueByNetworkId, RequestedAssetType.ZRX);
    }
    public async dispenseWETHOrder(req: express.Request, res: express.Response) {
        await this._dispenseOrder(req, res, RequestedAssetType.WETH);
    }
    public async dispenseZRXOrder(req: express.Request, res: express.Response, next: express.NextFunction) {
        await this._dispenseOrder(req, res, RequestedAssetType.ZRX);
    }
    // tslint:disable-next-line:prefer-function-over-method
    private _dispenseAsset(
        req: express.Request,
        res: express.Response,
        requestQueueByNetworkId: ItemByNetworkId<RequestQueue>,
        requestedAssetType: RequestedAssetType,
    ) {
        const requestQueue = _.get(requestQueueByNetworkId, req.networkId);
        if (_.isUndefined(requestQueue)) {
            res.status(400).send('UNSUPPORTED_NETWORK_ID');
            return;
        }
        const didAddToQueue = requestQueue.add(req.recipientAddress);
        if (!didAddToQueue) {
            res.status(503).send('QUEUE_IS_FULL');
            return;
        }
        utils.consoleLog(`Added ${req.recipientAddress} to queue: ${requestedAssetType} networkId: ${req.networkId}`);
        res.status(200).end();
    }
    private async _dispenseOrder(req: express.Request, res: express.Response, requestedAssetType: RequestedAssetType) {
        const zeroEx = _.get(this._zeroExByNetworkId, req.networkId);
        if (_.isUndefined(zeroEx)) {
            res.status(400).send('UNSUPPORTED_NETWORK_ID');
            return;
        }
        res.setHeader('Content-Type', 'application/json');
        const makerTokenAddress = await zeroEx.tokenRegistry.getTokenAddressBySymbolIfExistsAsync(requestedAssetType);
        if (_.isUndefined(makerTokenAddress)) {
            res.status(400).send('INVALID_TOKEN');
            return;
        }
        const takerTokenSymbol =
            requestedAssetType === RequestedAssetType.WETH ? RequestedAssetType.ZRX : RequestedAssetType.WETH;
        const takerTokenAddress = await zeroEx.tokenRegistry.getTokenAddressBySymbolIfExistsAsync(takerTokenSymbol);
        if (_.isUndefined(takerTokenAddress)) {
            res.status(400).send('INVALID_TOKEN');
            return;
        }
        const makerTokenAmount = new BigNumber(0.1);
        const takerTokenAmount = new BigNumber(0.1);
        const order: Order = {
            maker: configs.DISPENSER_ADDRESS,
            taker: req.recipientAddress,
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            makerTokenAmount,
            takerTokenAmount,
            makerTokenAddress,
            takerTokenAddress,
            salt: ZeroEx.generatePseudoRandomSalt(),
            exchangeContractAddress: zeroEx.exchange.getContractAddress(),
            feeRecipient: ZeroEx.NULL_ADDRESS,
            expirationUnixTimestampSec: new BigNumber(Date.now() + TWO_DAYS_IN_MS),
        };
        const orderHash = ZeroEx.getOrderHashHex(order);
        const signature = await zeroEx.signOrderHashAsync(orderHash, configs.DISPENSER_ADDRESS, false);
        const signedOrder = {
            ...order,
            signature,
        };
        const signedOrderHash = ZeroEx.getOrderHashHex(signedOrder);
        const payload = JSON.stringify(signedOrder);
        utils.consoleLog(`Dispensed signed order: ${payload}`);
        res.status(200).send(payload);
    }
    // tslint:disable-next-line:prefer-function-over-method
    private _createProviderEngine(rpcUrl: string) {
        const engine = new ProviderEngine();
        engine.addProvider(new NonceSubprovider());
        engine.addProvider(new HookedWalletSubprovider(idManagement));
        engine.addProvider(
            new RpcSubprovider({
                rpcUrl,
            }),
        );
        engine.start();
        return engine;
    }
}
