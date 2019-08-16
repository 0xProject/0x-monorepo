import {
    assetDataUtils,
    BigNumber,
    ContractWrappers,
    generatePseudoRandomSalt,
    Order,
    orderHashUtils,
    RPCSubprovider,
    signatureUtils,
    SignedOrder,
    Web3ProviderEngine,
} from '0x.js';
import { NonceTrackerSubprovider, PrivateKeyWalletSubprovider } from '@0x/subproviders';
import { logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as express from 'express';
import * as _ from 'lodash';

import { configs } from './configs';
import { constants } from './constants';
import { DispatchQueue } from './dispatch_queue';
import { dispenseAssetTasks } from './dispense_asset_tasks';
import { rpcUrls } from './rpc_urls';
import { TOKENS_BY_NETWORK } from './tokens';

interface NetworkConfig {
    dispatchQueue: DispatchQueue;
    web3Wrapper: Web3Wrapper;
    contractWrappers: ContractWrappers;
    networkId: number;
}

interface ItemByNetworkId<T> {
    [networkId: string]: T;
}

enum RequestedAssetType {
    ETH = 'ETH', // tslint:disable-line:enum-naming
    WETH = 'WETH', // tslint:disable-line:enum-naming
    ZRX = 'ZRX', // tslint:disable-line:enum-naming
}

const FIVE_DAYS_IN_MS = 4.32e8; // TODO: make this configurable
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO = new BigNumber(0);
const ASSET_AMOUNT = new BigNumber(0.1);

export class Handler {
    private readonly _networkConfigByNetworkId: ItemByNetworkId<NetworkConfig> = {};
    private static _createProviderEngine(rpcUrl: string): Web3ProviderEngine {
        if (configs.DISPENSER_PRIVATE_KEY === undefined) {
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
        _.forIn(rpcUrls, (rpcUrl: string, networkIdString: string) => {
            const providerObj = Handler._createProviderEngine(rpcUrl);
            const web3Wrapper = new Web3Wrapper(providerObj);
            // tslint:disable-next-line:custom-no-magic-numbers
            const networkId = parseInt(networkIdString, 10);
            const contractWrappersConfig = {
                networkId,
            };
            const contractWrappers = new ContractWrappers(providerObj, contractWrappersConfig);
            const dispatchQueue = new DispatchQueue();
            this._networkConfigByNetworkId[networkId] = {
                dispatchQueue,
                web3Wrapper,
                contractWrappers,
                networkId,
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
        const networkConfig = _.get(this._networkConfigByNetworkId, networkId);
        if (networkConfig === undefined) {
            res.status(constants.BAD_REQUEST_STATUS).send('UNSUPPORTED_NETWORK_ID');
            return;
        }
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
                    networkConfig.networkId,
                    networkConfig.contractWrappers.getProvider(),
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
        if (networkConfig === undefined) {
            res.status(constants.BAD_REQUEST_STATUS).send('UNSUPPORTED_NETWORK_ID');
            return;
        }
        res.setHeader('Content-Type', 'application/json');
        const makerTokenIfExists = _.get(TOKENS_BY_NETWORK, [networkConfig.networkId, requestedAssetType]);
        if (makerTokenIfExists === undefined) {
            throw new Error(`Unsupported asset type: ${requestedAssetType}`);
        }
        const takerTokenSymbol =
            requestedAssetType === RequestedAssetType.WETH ? RequestedAssetType.ZRX : RequestedAssetType.WETH;
        const takerTokenIfExists = _.get(TOKENS_BY_NETWORK, [networkConfig.networkId, takerTokenSymbol]);
        if (takerTokenIfExists === undefined) {
            throw new Error(`Unsupported asset type: ${takerTokenSymbol}`);
        }

        const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(ASSET_AMOUNT, makerTokenIfExists.decimals);
        const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(ASSET_AMOUNT, takerTokenIfExists.decimals);
        const makerAssetData = assetDataUtils.encodeERC20AssetData(makerTokenIfExists.address);
        const takerAssetData = assetDataUtils.encodeERC20AssetData(takerTokenIfExists.address);
        const order: Order = {
            makerAddress: configs.DISPENSER_ADDRESS,
            takerAddress: req.params.recipient as string,
            makerFee: ZERO,
            takerFee: ZERO,
            makerAssetAmount,
            takerAssetAmount,
            makerAssetData,
            takerAssetData,
            salt: generatePseudoRandomSalt(),
            exchangeAddress: networkConfig.contractWrappers.exchange.address,
            feeRecipientAddress: NULL_ADDRESS,
            senderAddress: NULL_ADDRESS,
            expirationTimeSeconds: new BigNumber(Date.now() + FIVE_DAYS_IN_MS)
                // tslint:disable-next-line:custom-no-magic-numbers
                .div(1000)
                .integerValue(BigNumber.ROUND_FLOOR),
        };
        const orderHash = orderHashUtils.getOrderHashHex(order);
        const signature = await signatureUtils.ecSignHashAsync(
            networkConfig.web3Wrapper.getProvider(),
            orderHash,
            configs.DISPENSER_ADDRESS,
        );
        const signedOrder: SignedOrder = {
            ...order,
            signature,
        };
        const payload = JSON.stringify(signedOrder);
        logUtils.log(`Dispensed signed order: ${payload}`);
        res.status(constants.SUCCESS_STATUS).send(payload);
    }
}
