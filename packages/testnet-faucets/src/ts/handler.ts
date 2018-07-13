import { Order, ZeroEx } from '0x.js';
import { BigNumber, logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as express from 'express';
import * as _ from 'lodash';

import {
    NonceTrackerSubprovider,
    PrivateKeyWalletSubprovider,
    RPCSubprovider,
    Web3ProviderEngine,
} from '@0xproject/subproviders';

import { configs } from './configs';
import { constants } from './constants';
import { DispatchQueue } from './dispatch_queue';
import { dispenseAssetTasks } from './dispense_asset_tasks';
import { rpcUrls } from './rpc_urls';

interface NetworkConfig {
    dispatchQueue: DispatchQueue;
    web3Wrapper: Web3Wrapper;
    zeroEx: ZeroEx;
}

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
    private _networkConfigByNetworkId: ItemByNetworkId<NetworkConfig> = {};
    private static _createProviderEngine(rpcUrl: string): Provider {
        if (_.isUndefined(configs.DISPENSER_PRIVATE_KEY)) {
            throw new Error('Dispenser Private key not found');
        }
        const engine = new Web3ProviderEngine();
        engine.addProvider(new NonceTrackerSubprovider());
        engine.addProvider(new PrivateKeyWalletSubprovider(configs.DISPENSER_PRIVATE_KEY));
        engine.addProvider(new RPCSubprovider(rpcUrl));
        engine.start();
        return engine;
    }
    constructor() {
        _.forIn(rpcUrls, (rpcUrl: string, networkId: string) => {
            const providerObj = Handler._createProviderEngine(rpcUrl);
            const web3Wrapper = new Web3Wrapper(providerObj);
            const zeroExConfig = {
                networkId: +networkId,
            };
            const zeroEx = new ZeroEx(providerObj, zeroExConfig);
            const dispatchQueue = new DispatchQueue();
            this._networkConfigByNetworkId[networkId] = {
                dispatchQueue,
                web3Wrapper,
                zeroEx,
            };
        });
    }
    public getQueueInfo(_req: express.Request, res: express.Response): void {
        res.setHeader('Content-Type', 'application/json');
        const queueInfo = _.mapValues(rpcUrls, (_rpcUrl: string, networkId: string) => {
            const dispatchQueue = this._networkConfigByNetworkId[networkId].dispatchQueue;
            return {
                full: dispatchQueue.isFull(),
                size: dispatchQueue.size(),
            };
        });
        const payload = JSON.stringify(queueInfo);
        res.status(constants.SUCCESS_STATUS).send(payload);
    }
    public dispenseEther(req: express.Request, res: express.Response): void {
        this._dispenseAsset(req, res, RequestedAssetType.ETH);
    }
    public dispenseZRX(req: express.Request, res: express.Response): void {
        this._dispenseAsset(req, res, RequestedAssetType.ZRX);
    }
    public async dispenseWETHOrderAsync(req: express.Request, res: express.Response): Promise<void> {
        await this._dispenseOrderAsync(req, res, RequestedAssetType.WETH);
    }
    public async dispenseZRXOrderAsync(
        req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
    ): Promise<void> {
        await this._dispenseOrderAsync(req, res, RequestedAssetType.ZRX);
    }
    private _dispenseAsset(req: express.Request, res: express.Response, requestedAssetType: RequestedAssetType): void {
        const networkId = req.params.networkId;
        const recipient = req.params.recipient;
        const networkConfig = this._networkConfigByNetworkId[networkId];
        let dispenserTask;
        switch (requestedAssetType) {
            case RequestedAssetType.ETH:
                dispenserTask = dispenseAssetTasks.dispenseEtherTask(recipient, networkConfig.web3Wrapper);
                break;
            case RequestedAssetType.WETH:
            case RequestedAssetType.ZRX:
                dispenserTask = dispenseAssetTasks.dispenseTokenTask(
                    recipient,
                    requestedAssetType,
                    networkConfig.zeroEx,
                );
                break;
            default:
                throw new Error(`Unsupported asset type: ${requestedAssetType}`);
        }
        const didAddToQueue = networkConfig.dispatchQueue.add(dispenserTask);
        if (!didAddToQueue) {
            res.status(constants.SERVICE_UNAVAILABLE_STATUS).send('QUEUE_IS_FULL');
            return;
        }
        logUtils.log(`Added ${recipient} to queue: ${requestedAssetType} networkId: ${networkId}`);
        res.status(constants.SUCCESS_STATUS).end();
    }
    private async _dispenseOrderAsync(
        req: express.Request,
        res: express.Response,
        requestedAssetType: RequestedAssetType,
    ): Promise<void> {
        const networkConfig = _.get(this._networkConfigByNetworkId, req.params.networkId);
        if (_.isUndefined(networkConfig)) {
            res.status(constants.BAD_REQUEST_STATUS).send('UNSUPPORTED_NETWORK_ID');
            return;
        }
        const zeroEx = networkConfig.zeroEx;
        res.setHeader('Content-Type', 'application/json');
        const makerToken = await zeroEx.tokenRegistry.getTokenBySymbolIfExistsAsync(requestedAssetType);
        if (_.isUndefined(makerToken)) {
            throw new Error(`Unsupported asset type: ${requestedAssetType}`);
        }
        const takerTokenSymbol =
            requestedAssetType === RequestedAssetType.WETH ? RequestedAssetType.ZRX : RequestedAssetType.WETH;
        const takerToken = await zeroEx.tokenRegistry.getTokenBySymbolIfExistsAsync(takerTokenSymbol);
        if (_.isUndefined(takerToken)) {
            throw new Error(`Unsupported asset type: ${requestedAssetType}`);
        }
        const makerTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(0.1), makerToken.decimals);
        const takerTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(0.1), takerToken.decimals);
        const order: Order = {
            maker: configs.DISPENSER_ADDRESS,
            taker: req.params.recipient,
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            makerTokenAmount,
            takerTokenAmount,
            makerTokenAddress: makerToken.address,
            takerTokenAddress: takerToken.address,
            salt: ZeroEx.generatePseudoRandomSalt(),
            exchangeContractAddress: zeroEx.exchange.getContractAddress(),
            feeRecipient: ZeroEx.NULL_ADDRESS,
            expirationUnixTimestampSec: new BigNumber(Date.now() + FIVE_DAYS_IN_MS),
        };
        const orderHash = ZeroEx.getOrderHashHex(order);
        const signature = await zeroEx.signOrderHashAsync(orderHash, configs.DISPENSER_ADDRESS, false);
        const signedOrder = {
            ...order,
            ecSignature: signature,
        };
        const payload = JSON.stringify(signedOrder);
        logUtils.log(`Dispensed signed order: ${payload}`);
        res.status(constants.SUCCESS_STATUS).send(payload);
    }
}
