import { NonceTrackerSubprovider } from '@0xproject/subproviders';
import { addressUtils } from '@0xproject/utils';
import * as express from 'express';
import * as _ from 'lodash';
import ProviderEngine = require('web3-provider-engine');
import HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

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

interface RequestQueueByNetworkId {
    [networkId: string]: RequestQueue;
}

enum QueueType {
    ETH = 'ETH',
    ZRX = 'ZRX',
}

const DEFAULT_NETWORK_ID = 42; // kovan

export class Handler {
    private _etherRequestQueueByNetworkId: RequestQueueByNetworkId = {};
    private _zrxRequestQueueByNetworkId: RequestQueueByNetworkId = {};
    constructor() {
        _.forIn(rpcUrls, (rpcUrl: string, networkId: string) => {
            const providerObj = this._createProviderEngine(rpcUrl);
            const web3 = new Web3(providerObj);
            this._etherRequestQueueByNetworkId[networkId] = new EtherRequestQueue(web3);
            this._zrxRequestQueueByNetworkId[networkId] = new ZRXRequestQueue(web3, +networkId);
        });
    }
    public getQueueInfo(req: express.Request, res: express.Response) {
        res.setHeader('Content-Type', 'application/json');
        const queueInfo = _.mapValues(rpcUrls, (rpcUrl: string, networkId: string) => {
            utils.consoleLog(networkId);
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
        this._dispense(req, res, this._etherRequestQueueByNetworkId, QueueType.ETH);
    }
    public dispenseZRX(req: express.Request, res: express.Response) {
        this._dispense(req, res, this._zrxRequestQueueByNetworkId, QueueType.ZRX);
    }
    private _dispense(
        req: express.Request,
        res: express.Response,
        requestQueueByNetworkId: RequestQueueByNetworkId,
        queueType: QueueType,
    ) {
        const recipientAddress = req.params.recipient;
        if (_.isUndefined(recipientAddress) || !this._isValidEthereumAddress(recipientAddress)) {
            res.status(400).send('INVALID_RECIPIENT_ADDRESS');
            return;
        }
        const networkId = _.get(req.query, 'networkId', DEFAULT_NETWORK_ID);
        const requestQueue = _.get(requestQueueByNetworkId, networkId);
        if (_.isUndefined(requestQueue)) {
            res.status(400).send('INVALID_NETWORK_ID');
            return;
        }
        const lowerCaseRecipientAddress = recipientAddress.toLowerCase();
        const didAddToQueue = requestQueue.add(lowerCaseRecipientAddress);
        if (!didAddToQueue) {
            res.status(503).send('QUEUE_IS_FULL');
            return;
        }
        utils.consoleLog(`Added ${lowerCaseRecipientAddress} to queue: ${queueType} networkId: ${networkId}`);
        res.status(200).end();
    }
    // tslint:disable-next-line:prefer-function-over-method
    private _createProviderEngine(rpcUrl: string) {
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
    // tslint:disable-next-line:prefer-function-over-method
    private _isValidEthereumAddress(address: string): boolean {
        const lowercaseAddress = address.toLowerCase();
        return addressUtils.isAddress(lowercaseAddress);
    }
}
