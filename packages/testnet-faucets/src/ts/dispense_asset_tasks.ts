import { ZeroEx } from '0x.js';
import { BigNumber, promisify } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { configs } from './configs';
import { errorReporter } from './error_reporter';
import { utils } from './utils';

const DISPENSE_AMOUNT_ETHER = 0.1;
const DISPENSE_AMOUNT_TOKEN = 0.1;

export const dispenseAssetTasks = {
    dispenseEtherTask(recipientAddress: string, web3: Web3) {
        return async () => {
            utils.consoleLog(`Processing ETH ${recipientAddress}`);
            const sendTransactionAsync = promisify(web3.eth.sendTransaction);
            try {
                const txHash = await sendTransactionAsync({
                    from: configs.DISPENSER_ADDRESS,
                    to: recipientAddress,
                    value: web3.toWei(DISPENSE_AMOUNT_ETHER, 'ether'),
                });
                utils.consoleLog(`Sent ${DISPENSE_AMOUNT_ETHER} ETH to ${recipientAddress} tx: ${txHash}`);
            } catch (err) {
                utils.consoleLog(`Unexpected err: ${err} - ${JSON.stringify(err)}`);
                await errorReporter.reportAsync(err);
            }
        };
    },
    dispenseTokenTask(recipientAddress: string, tokenSymbol: string, zeroEx: ZeroEx) {
        return async () => {
            utils.consoleLog(`Processing ${tokenSymbol} ${recipientAddress}`);
            const amountToDispense = new BigNumber(DISPENSE_AMOUNT_TOKEN);
            try {
                const token = await zeroEx.tokenRegistry.getTokenBySymbolIfExistsAsync(tokenSymbol);
                if (_.isUndefined(token)) {
                    throw new Error(`Unsupported asset type: ${tokenSymbol}`);
                }
                const baseUnitAmount = ZeroEx.toBaseUnitAmount(amountToDispense, token.decimals);
                const txHash = await zeroEx.token.transferAsync(
                    token.address,
                    configs.DISPENSER_ADDRESS,
                    recipientAddress,
                    baseUnitAmount,
                );
                utils.consoleLog(`Sent ${amountToDispense} ZRX to ${recipientAddress} tx: ${txHash}`);
            } catch (err) {
                utils.consoleLog(`Unexpected err: ${err} - ${JSON.stringify(err)}`);
                await errorReporter.reportAsync(err);
            }
        };
    },
};
