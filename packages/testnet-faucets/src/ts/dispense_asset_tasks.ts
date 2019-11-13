import { ERC20TokenContract, SupportedProvider } from '0x.js';
import { BigNumber, logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { configs } from './configs';
import { TOKENS_BY_CHAIN } from './tokens';

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
            if (userBalance.isGreaterThanOrEqualTo(maxAmountInWei)) {
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
        chainId: number,
        provider: SupportedProvider,
    ): AsyncTask {
        return async () => {
            logUtils.log(`Processing ${tokenSymbol} ${recipientAddress}`);
            const amountToDispense = new BigNumber(DISPENSE_AMOUNT_TOKEN);
            const tokenIfExists = _.get(TOKENS_BY_CHAIN, [chainId, tokenSymbol]);
            if (tokenIfExists === undefined) {
                throw new Error(`Unsupported asset type: ${tokenSymbol}`);
            }
            const baseUnitAmount = Web3Wrapper.toBaseUnitAmount(amountToDispense, tokenIfExists.decimals);
            const erc20Token = new ERC20TokenContract(tokenIfExists.address, provider);
            const userBalanceBaseUnits = await erc20Token.balanceOf(recipientAddress).callAsync();
            const maxAmountBaseUnits = Web3Wrapper.toBaseUnitAmount(
                new BigNumber(DISPENSE_MAX_AMOUNT_TOKEN),
                tokenIfExists.decimals,
            );
            if (userBalanceBaseUnits.isGreaterThanOrEqualTo(maxAmountBaseUnits)) {
                logUtils.log(
                    `User exceeded token balance maximum (${maxAmountBaseUnits}) ${recipientAddress} ${userBalanceBaseUnits} `,
                );
                return;
            }
            const txHash = await erc20Token.transfer(recipientAddress, baseUnitAmount).sendTransactionAsync({
                from: configs.DISPENSER_ADDRESS,
            });
            logUtils.log(`Sent ${amountToDispense} ${tokenSymbol} to ${recipientAddress} tx: ${txHash}`);
        };
    },
};
