import { promisify } from '@0xproject/utils';
import * as _ from 'lodash';

import { configs } from './configs';
import { errorReporter } from './error_reporter';
import { RequestQueue } from './request_queue';
import { utils } from './utils';

const DISPENSE_AMOUNT_ETHER = 0.1;

export class EtherRequestQueue extends RequestQueue {
    protected async _processNextRequestFireAndForgetAsync(recipientAddress: string) {
        utils.consoleLog(`Processing ETH ${recipientAddress}`);
        const sendTransactionAsync = promisify(this._web3.eth.sendTransaction);
        try {
            const txHash = await sendTransactionAsync({
                from: configs.DISPENSER_ADDRESS,
                to: recipientAddress,
                value: this._web3.toWei(DISPENSE_AMOUNT_ETHER, 'ether'),
            });
            utils.consoleLog(`Sent ${DISPENSE_AMOUNT_ETHER} ETH to ${recipientAddress} tx: ${txHash}`);
        } catch (err) {
            utils.consoleLog(`Unexpected err: ${err} - ${JSON.stringify(err)}`);
            await errorReporter.reportAsync(err);
        }
    }
}
