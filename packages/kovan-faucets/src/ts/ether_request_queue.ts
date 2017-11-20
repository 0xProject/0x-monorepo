import * as _ from 'lodash';
import promisify = require('es6-promisify');
import {utils} from './utils';
import {configs} from './configs';
import {RequestQueue} from './request_queue';
import {errorReporter} from './error_reporter';

const DISPENSE_AMOUNT_ETHER = 0.1;

export class EtherRequestQueue extends RequestQueue {
    protected async processNextRequestFireAndForgetAsync(recipientAddress: string) {
        utils.consoleLog(`Processing ETH ${recipientAddress}`);
        const sendTransactionAsync = promisify(this.web3.eth.sendTransaction);
        try {
            const txHash = await sendTransactionAsync({
                from: configs.DISPENSER_ADDRESS,
                to: recipientAddress,
                value: this.web3.toWei(DISPENSE_AMOUNT_ETHER, 'ether'),
            });
            utils.consoleLog(`Sent ${DISPENSE_AMOUNT_ETHER} ETH to ${recipientAddress} tx: ${txHash}`);
        } catch (err) {
            utils.consoleLog(`Unexpected err: ${err} - ${JSON.stringify(err)}`);
            await errorReporter.reportAsync(err);
        }
    }
}
