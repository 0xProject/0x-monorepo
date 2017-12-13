import {ZeroEx} from '0x.js';
import {promisify} from '@0xproject/utils';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import {configs} from './configs';
import {errorReporter} from './error_reporter';
import {RequestQueue} from './request_queue';
import {utils} from './utils';

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
