import {ZeroEx} from '0x.js';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';

import {configs} from './configs';
import {errorReporter} from './error_reporter';
import {RequestQueue} from './request_queue';
import {utils} from './utils';

// HACK: web3 leaks XMLHttpRequest into the global scope and causes requests to hang
// because they are using the wrong XHR package.
// Filed issue: https://github.com/ethereum/web3.js/issues/844
// tslint:disable-next-line:ordered-imports
import * as Web3 from 'web3';

const DISPENSE_AMOUNT_ZRX = new BigNumber(0.1);
const QUEUE_INTERVAL_MS = 5000;

export class ZRXRequestQueue extends RequestQueue {
    private zeroEx: ZeroEx;
    constructor(web3: Web3) {
        super(web3);
        this.queueIntervalMs = QUEUE_INTERVAL_MS;
        const zeroExConfig = {
            networkId: configs.KOVAN_NETWORK_ID,
        };
        this.zeroEx = new ZeroEx(web3.currentProvider, zeroExConfig);
    }
    protected async processNextRequestFireAndForgetAsync(recipientAddress: string) {
        utils.consoleLog(`Processing ZRX ${recipientAddress}`);
        const baseUnitAmount = ZeroEx.toBaseUnitAmount(DISPENSE_AMOUNT_ZRX, 18);
        try {
            await this.zeroEx.token.transferAsync(
                configs.ZRX_TOKEN_ADDRESS, configs.DISPENSER_ADDRESS, recipientAddress, baseUnitAmount,
            );
            utils.consoleLog(`Sent ${DISPENSE_AMOUNT_ZRX} ZRX to ${recipientAddress}`);
        } catch (err) {
            utils.consoleLog(`Unexpected err: ${err} - ${JSON.stringify(err)}`);
            await errorReporter.reportAsync(err);
        }
    }
}
