import * as express from 'express';
import * as _ from 'lodash';
import ProviderEngine = require('web3-provider-engine');
import HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet');
import NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import {configs} from './configs';
import {EtherRequestQueue} from './ether_request_queue';
import {idManagement} from './id_management';
import {utils} from './utils';
import {ZRXRequestQueue} from './zrx_request_queue';

// HACK: web3 leaks XMLHttpRequest into the global scope and causes requests to hang
// because they are using the wrong XHR package.
// Filed issue: https://github.com/ethereum/web3.js/issues/844
// tslint:disable-next-line:ordered-imports
import * as Web3 from 'web3';

export class Handler {
    private etherRequestQueue: EtherRequestQueue;
    private zrxRequestQueue: ZRXRequestQueue;
    private web3: Web3;
    constructor() {
        // Setup provider engine to talk with RPC node
        const providerObj = this.createProviderEngine(configs.RPC_URL);
        this.web3 = new Web3(providerObj);

        this.etherRequestQueue = new EtherRequestQueue(this.web3);
        this.zrxRequestQueue = new ZRXRequestQueue(this.web3);
    }
    public dispenseEther(req: express.Request, res: express.Response) {
        const recipientAddress = req.params.recipient;
        if (_.isUndefined(recipientAddress) || !this.isValidEthereumAddress(recipientAddress)) {
            res.status(400).send('INVALID_REQUEST');
            return;
        }
        const lowerCaseRecipientAddress = recipientAddress.toLowerCase();
        const didAddToQueue = this.etherRequestQueue.add(lowerCaseRecipientAddress);
        if (!didAddToQueue) {
            res.status(503).send('QUEUE_IS_FULL');
            return;
        }
        utils.consoleLog(`Added ${lowerCaseRecipientAddress} to the ETH queue`);
        res.status(200).end();
    }
    public dispenseZRX(req: express.Request, res: express.Response) {
        const recipientAddress = req.params.recipient;
        if (_.isUndefined(recipientAddress) || !this.isValidEthereumAddress(recipientAddress)) {
            res.status(400).send('INVALID_REQUEST');
            return;
        }
        const lowerCaseRecipientAddress = recipientAddress.toLowerCase();
        const didAddToQueue = this.zrxRequestQueue.add(lowerCaseRecipientAddress);
        if (!didAddToQueue) {
            res.status(503).send('QUEUE_IS_FULL');
            return;
        }
        utils.consoleLog(`Added ${lowerCaseRecipientAddress} to the ZRX queue`);
        res.status(200).end();
    }
    public getQueueInfo(req: express.Request, res: express.Response) {
        res.setHeader('Content-Type', 'application/json');
        const payload = JSON.stringify({
            ether: {
                full: this.etherRequestQueue.isFull(),
                size: this.etherRequestQueue.size(),
            },
            zrx: {
                full: this.zrxRequestQueue.isFull(),
                size: this.zrxRequestQueue.size(),
            },
        });
        res.status(200).send(payload);
    }
    // tslint:disable-next-line:prefer-function-over-method
    private createProviderEngine(rpcUrl: string) {
        const engine = new ProviderEngine();
        engine.addProvider(new NonceSubprovider());
        engine.addProvider(new HookedWalletSubprovider(idManagement));
        engine.addProvider(new RpcSubprovider({
            rpcUrl,
        }));
        engine.start();
        return engine;
    }
    private isValidEthereumAddress(address: string): boolean {
        const lowercaseAddress = address.toLowerCase();
        return this.web3.isAddress(lowercaseAddress);
    }
}
