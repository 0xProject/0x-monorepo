import { ZeroEx } from '0x.js';
import { BigNumber, logUtils, promisify } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { configs } from './configs';

const DISPENSE_AMOUNT_ETHER = 0.1;
const DISPENSE_AMOUNT_TOKEN = 0.1;
const DISPENSE_MAX_AMOUNT_TOKEN = 2;
const DISPENSE_MAX_AMOUNT_ETHER = 2;

type AsyncTask = () => Promise<void>;

export const dispenseAssetTasks = {
    dispenseEtherTask(recipientAddress: string, web3Wrapper: Web3Wrapper): AsyncTask {
        return async () => {
            logUtils.log(`Processing ETH ${recipientAddress}`);
            const userBalance = await web3Wrapper.getBalanceInWeiAsync(recipientAddress);
            const maxAmountInWei = Web3Wrapper.toWei(new BigNumber(DISPENSE_MAX_AMOUNT_ETHER));
            if (userBalance.greaterThanOrEqualTo(maxAmountInWei)) {
                logUtils.log(
                    `User exceeded ETH balance maximum (${maxAmountInWei}) ${recipientAddress} ${userBalance} `,
                );
                return;
            }
            const txHash = await web3Wrapper.sendTransactionAsync({
                from: configs.DISPENSER_ADDRESS,
                to: recipientAddress,
                value: Web3Wrapper.toWei(new BigNumber(DISPENSE_AMOUNT_ETHER)),
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
