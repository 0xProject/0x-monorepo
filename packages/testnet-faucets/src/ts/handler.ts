import { Order, SignedOrder, ZeroEx } from '0x.js';
import { NonceTrackerSubprovider } from '@0xproject/subproviders';
import { BigNumber } from '@0xproject/utils';
import * as express from 'express';
import * as _ from 'lodash';
import * as Web3 from 'web3';

// HACK: web3 injects XMLHttpRequest into the global scope and ProviderEngine checks XMLHttpRequest
// to know whether it is running in a browser or node environment. We need it to be undefined since
// we are not running in a browser env.
// Filed issue: https://github.com/ethereum/web3.js/issues/844
(global as any).XMLHttpRequest = undefined;
import ProviderEngine = require('web3-provider-engine');
import HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import { configs } from './configs';
import { EtherRequestQueue } from './ether_request_queue';
import { idManagement } from './id_management';
import { RequestQueue } from './request_queue';
import { rpcUrls } from './rpc_urls';
import { utils } from './utils';
import { ZRXRequestQueue } from './zrx_request_queue';

interface ItemByNetworkId<T> {
    [networkId: string]: T;
}

enum RequestedAssetType {
    ETH = 'ETH',
    WETH = 'WETH',
    ZRX = 'ZRX',
}

const FIVE_DAYS_IN_MS = 4.32e8; // TODO: make this configurable

export class Handler {
    private _zeroExByNetworkId: ItemByNetworkId<ZeroEx> = {};
    private _etherRequestQueueByNetworkId: ItemByNetworkId<RequestQueue> = {};
    private _zrxRequestQueueByNetworkId: ItemByNetworkId<RequestQueue> = {};
    private static _dispenseAsset(
        req: express.Request,
        res: express.Response,
        requestQueueByNetworkId: ItemByNetworkId<RequestQueue>,
        requestedAssetType: RequestedAssetType,
    ) {
        const requestQueue = _.get(requestQueueByNetworkId, req.params.networkId);
        if (_.isUndefined(requestQueue)) {
            res.status(400).send('UNSUPPORTED_NETWORK_ID');
            return;
        }
        const didAddToQueue = requestQueue.add(req.params.recipient);
        if (!didAddToQueue) {
            res.status(503).send('QUEUE_IS_FULL');
            return;
        }
        utils.consoleLog(
            `Added ${req.params.recipient} to queue: ${requestedAssetType} networkId: ${req.params.networkId}`,
        );
        res.status(200).end();
    }
    private static _createProviderEngine(rpcUrl: string) {
        const engine = new ProviderEngine();
        engine.addProvider(new NonceTrackerSubprovider());
        engine.addProvider(new HookedWalletSubprovider(idManagement));
        engine.addProvider(
            new RpcSubprovider({
                rpcUrl,
            }),
        );
        engine.start();
        return engine;
    }
    constructor() {
        _.forIn(rpcUrls, (rpcUrl: string, networkId: string) => {
            const providerObj = Handler._createProviderEngine(rpcUrl);
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
        Handler._dispenseAsset(req, res, this._etherRequestQueueByNetworkId, RequestedAssetType.ETH);
    }
    public dispenseZRX(req: express.Request, res: express.Response) {
        Handler._dispenseAsset(req, res, this._zrxRequestQueueByNetworkId, RequestedAssetType.ZRX);
    }
    public async dispenseWETHOrder(req: express.Request, res: express.Response) {
        await this._dispenseOrder(req, res, RequestedAssetType.WETH);
    }
    public async dispenseZRXOrder(req: express.Request, res: express.Response, next: express.NextFunction) {
        await this._dispenseOrder(req, res, RequestedAssetType.ZRX);
    }
    private async _dispenseOrder(req: express.Request, res: express.Response, requestedAssetType: RequestedAssetType) {
        const zeroEx = _.get(this._zeroExByNetworkId, req.params.networkId);
        if (_.isUndefined(zeroEx)) {
            res.status(400).send('UNSUPPORTED_NETWORK_ID');
            return;
        }
        res.setHeader('Content-Type', 'application/json');
        const makerTokenAddress = await zeroEx.tokenRegistry.getTokenAddressBySymbolIfExistsAsync(requestedAssetType);
        if (_.isUndefined(makerTokenAddress)) {
            throw new Error(`Unsupported asset type: ${requestedAssetType}`);
        }
        const takerTokenSymbol =
            requestedAssetType === RequestedAssetType.WETH ? RequestedAssetType.ZRX : RequestedAssetType.WETH;
        const takerTokenAddress = await zeroEx.tokenRegistry.getTokenAddressBySymbolIfExistsAsync(takerTokenSymbol);
        if (_.isUndefined(takerTokenAddress)) {
            throw new Error(`Unsupported asset type: ${requestedAssetType}`);
        }
        const makerTokenAmount = new BigNumber(0.1);
        const takerTokenAmount = new BigNumber(0.1);
        const order: Order = {
            maker: configs.DISPENSER_ADDRESS,
            taker: req.params.recipient,
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            makerTokenAmount,
            takerTokenAmount,
            makerTokenAddress,
            takerTokenAddress,
            salt: ZeroEx.generatePseudoRandomSalt(),
            exchangeContractAddress: zeroEx.exchange.getContractAddress(),
            feeRecipient: ZeroEx.NULL_ADDRESS,
            expirationUnixTimestampSec: new BigNumber(Date.now() + FIVE_DAYS_IN_MS),
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
}
