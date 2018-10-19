import { ERC20TokenWrapper } from '0x.js';
import { BigNumber, logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { configs } from './configs';
import { TOKENS_BY_NETWORK } from './tokens';

const DISPENSE_AMOUNT_ETHER = 0.1;
const DISPENSE_AMOUNT_TOKEN = 1;
const DISPENSE_MAX_AMOUNT_TOKEN = 100;
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
    dispenseTokenTask(
        recipientAddress: string,
        tokenSymbol: string,
        networkId: number,
        erc20TokenWrapper: ERC20TokenWrapper,
    ): AsyncTask {
        return async () => {
            logUtils.log(`Processing ${tokenSymbol} ${recipientAddress}`);
            const amountToDispense = new BigNumber(DISPENSE_AMOUNT_TOKEN);
            const tokenIfExists = _.get(TOKENS_BY_NETWORK, [networkId, tokenSymbol]);
            if (_.isUndefined(tokenIfExists)) {
                throw new Error(`Unsupported asset type: ${tokenSymbol}`);
            }
            const baseUnitAmount = Web3Wrapper.toBaseUnitAmount(amountToDispense, tokenIfExists.decimals);
            const userBalanceBaseUnits = await erc20TokenWrapper.getBalanceAsync(
                tokenIfExists.address,
                recipientAddress,
            );
            const maxAmountBaseUnits = Web3Wrapper.toBaseUnitAmount(
                new BigNumber(DISPENSE_MAX_AMOUNT_TOKEN),
                tokenIfExists.decimals,
            );
            if (userBalanceBaseUnits.greaterThanOrEqualTo(maxAmountBaseUnits)) {
                logUtils.log(
                    `User exceeded token balance maximum (${maxAmountBaseUnits}) ${recipientAddress} ${userBalanceBaseUnits} `,
                );
                return;
            }
            const txHash = await erc20TokenWrapper.transferAsync(
                tokenIfExists.address,
                configs.DISPENSER_ADDRESS,
                recipientAddress,
                baseUnitAmount,
            );
            logUtils.log(`Sent ${amountToDispense} ${tokenSymbol} to ${recipientAddress} tx: ${txHash}`);
        };
    },
};
