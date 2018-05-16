import { ZeroEx } from '0x.js';
import { BigNumber, logUtils, promisify } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { configs } from './configs';
import { errorReporter } from './error_reporter';

const DISPENSE_AMOUNT_ETHER = 0.1;
const DISPENSE_AMOUNT_TOKEN = 0.1;
const DISPENSE_MAX_AMOUNT_TOKEN = 2;
const DISPENSE_MAX_AMOUNT_ETHER = 2;

type AsyncTask = () => Promise<void>;

export const dispenseAssetTasks = {
    dispenseEtherTask(recipientAddress: string, web3: Web3): AsyncTask {
        return async () => {
            logUtils.log(`Processing ETH ${recipientAddress}`);
            const userBalance = await promisify<BigNumber>(web3.eth.getBalance)(recipientAddress);
            const maxAmountInWei = new BigNumber(web3.toWei(DISPENSE_MAX_AMOUNT_ETHER, 'ether'));
            if (userBalance.greaterThanOrEqualTo(maxAmountInWei)) {
                logUtils.log(
                    `User exceeded ETH balance maximum (${maxAmountInWei}) ${recipientAddress} ${userBalance} `,
                );
                return;
            }
            const sendTransactionAsync = promisify(web3.eth.sendTransaction);
            const txHash = await sendTransactionAsync({
                from: configs.DISPENSER_ADDRESS,
                to: recipientAddress,
                value: web3.toWei(DISPENSE_AMOUNT_ETHER, 'ether'),
            });
            logUtils.log(`Sent ${DISPENSE_AMOUNT_ETHER} ETH to ${recipientAddress} tx: ${txHash}`);
        };
    },
    dispenseTokenTask(recipientAddress: string, tokenSymbol: string, zeroEx: ZeroEx): AsyncTask {
        return async () => {
            logUtils.log(`Processing ${tokenSymbol} ${recipientAddress}`);
            const amountToDispense = new BigNumber(DISPENSE_AMOUNT_TOKEN);
            const token = await zeroEx.tokenRegistry.getTokenBySymbolIfExistsAsync(tokenSymbol);
            if (_.isUndefined(token)) {
                throw new Error(`Unsupported asset type: ${tokenSymbol}`);
            }
            const baseUnitAmount = ZeroEx.toBaseUnitAmount(amountToDispense, token.decimals);
            const userBalanceBaseUnits = await zeroEx.token.getBalanceAsync(token.address, recipientAddress);
            const maxAmountBaseUnits = ZeroEx.toBaseUnitAmount(
                new BigNumber(DISPENSE_MAX_AMOUNT_TOKEN),
                token.decimals,
            );
            if (userBalanceBaseUnits.greaterThanOrEqualTo(maxAmountBaseUnits)) {
                logUtils.log(
                    `User exceeded token balance maximum (${maxAmountBaseUnits}) ${recipientAddress} ${userBalanceBaseUnits} `,
                );
                return;
            }
            const txHash = await zeroEx.token.transferAsync(
                token.address,
                configs.DISPENSER_ADDRESS,
                recipientAddress,
                baseUnitAmount,
            );
            logUtils.log(`Sent ${amountToDispense} ZRX to ${recipientAddress} tx: ${txHash}`);
        };
    },
};
