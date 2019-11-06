import {
    assetDataUtils,
    BigNumber,
    generatePseudoRandomSalt,
    Order,
    orderHashUtils,
    RPCSubprovider,
    signatureUtils,
    SignedOrder,
    Web3ProviderEngine,
} from '0x.js';
import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { NonceTrackerSubprovider, PrivateKeyWalletSubprovider } from '@0x/subproviders';
import { logUtils } from '@0x/utils';
import { SupportedProvider, Web3Wrapper } from '@0x/web3-wrapper';
import * as express from 'express';
import * as _ from 'lodash';

import { configs } from './configs';
import { constants } from './constants';
import { DispatchQueue } from './dispatch_queue';
import { dispenseAssetTasks } from './dispense_asset_tasks';
import { rpcUrls } from './rpc_urls';
import { TOKENS_BY_CHAIN } from './tokens';

interface ChainConfig {
    dispatchQueue: DispatchQueue;
    web3Wrapper: Web3Wrapper;
    provider: SupportedProvider;
    chainId: number;
}

interface ItemByChainId<T> {
    [chainId: string]: T;
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
    private readonly _chainConfigByChainId: ItemByChainId<ChainConfig> = {};
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
        _.forIn(rpcUrls, (rpcUrl: string, chainIdString: string) => {
            const providerObj = Handler._createProviderEngine(rpcUrl);
            const web3Wrapper = new Web3Wrapper(providerObj);
            // tslint:disable-next-line:custom-no-magic-numbers
            const chainId = parseInt(chainIdString, 10);
            const dispatchQueue = new DispatchQueue();
            this._chainConfigByChainId[chainId] = {
                dispatchQueue,
                web3Wrapper,
                provider: providerObj,
                chainId,
            };
        });
    }
    public getQueueInfo(_req: express.Request, res: express.Response): void {
        res.setHeader('Content-Type', 'application/json');
        const queueInfo = _.mapValues(rpcUrls, (_rpcUrl: string, chainId: string) => {
            const dispatchQueue = this._chainConfigByChainId[chainId].dispatchQueue;
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
        const chainId = req.params.chainId;
        const recipient = req.params.recipient;
        const chainConfig = _.get(this._chainConfigByChainId, chainId);
        if (chainConfig === undefined) {
            res.status(constants.BAD_REQUEST_STATUS).send('UNSUPPORTED_CHAIN_ID');
            return;
        }
        let dispenserTask;
        switch (requestedAssetType) {
            case RequestedAssetType.ETH:
                dispenserTask = dispenseAssetTasks.dispenseEtherTask(recipient, chainConfig.web3Wrapper);
                break;
            case RequestedAssetType.WETH:
            case RequestedAssetType.ZRX:
                dispenserTask = dispenseAssetTasks.dispenseTokenTask(
                    recipient,
                    requestedAssetType,
                    chainConfig.chainId,
                    chainConfig.provider,
                );
                break;
            default:
                throw new Error(`Unsupported asset type: ${requestedAssetType}`);
        }
        const didAddToQueue = chainConfig.dispatchQueue.add(dispenserTask);
        if (!didAddToQueue) {
            res.status(constants.SERVICE_UNAVAILABLE_STATUS).send('QUEUE_IS_FULL');
            return;
        }
        logUtils.log(`Added ${recipient} to queue: ${requestedAssetType} chainId: ${chainId}`);
        res.status(constants.SUCCESS_STATUS).end();
    }
    private async _dispenseOrderAsync(
        req: express.Request,
        res: express.Response,
        requestedAssetType: RequestedAssetType,
    ): Promise<void> {
        const chainConfig = _.get(this._chainConfigByChainId, req.params.chainId);
        if (chainConfig === undefined) {
            res.status(constants.BAD_REQUEST_STATUS).send('UNSUPPORTED_CHAIN_ID');
            return;
        }
        res.setHeader('Content-Type', 'application/json');
        const makerTokenIfExists = _.get(TOKENS_BY_CHAIN, [chainConfig.chainId, requestedAssetType]);
        if (makerTokenIfExists === undefined) {
            throw new Error(`Unsupported asset type: ${requestedAssetType}`);
        }
        const takerTokenSymbol =
            requestedAssetType === RequestedAssetType.WETH ? RequestedAssetType.ZRX : RequestedAssetType.WETH;
        const takerTokenIfExists = _.get(TOKENS_BY_CHAIN, [chainConfig.chainId, takerTokenSymbol]);
        if (takerTokenIfExists === undefined) {
            throw new Error(`Unsupported asset type: ${takerTokenSymbol}`);
        }

        const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(ASSET_AMOUNT, makerTokenIfExists.decimals);
        const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(ASSET_AMOUNT, takerTokenIfExists.decimals);
        const makerAssetData = assetDataUtils.encodeERC20AssetData(makerTokenIfExists.address);
        const takerAssetData = assetDataUtils.encodeERC20AssetData(takerTokenIfExists.address);
        const contractAddresses = getContractAddressesForChainOrThrow(chainConfig.chainId);
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
            makerFeeAssetData: makerAssetData,
            takerFeeAssetData: takerAssetData,
            feeRecipientAddress: NULL_ADDRESS,
            senderAddress: NULL_ADDRESS,
            expirationTimeSeconds: new BigNumber(Date.now() + FIVE_DAYS_IN_MS)
                // tslint:disable-next-line:custom-no-magic-numbers
                .div(1000)
                .integerValue(BigNumber.ROUND_FLOOR),
            exchangeAddress: contractAddresses.exchange,
            chainId: chainConfig.chainId,
        };
        const orderHash = orderHashUtils.getOrderHashHex(order);
        const signature = await signatureUtils.ecSignHashAsync(
            chainConfig.web3Wrapper.getProvider(),
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
