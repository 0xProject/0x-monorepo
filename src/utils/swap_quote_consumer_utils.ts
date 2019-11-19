import { ContractAddresses } from '@0x/contract-addresses';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { WETH9Contract } from '@0x/contracts-erc20';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { SupportedProvider, Web3Wrapper } from '@0x/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    ExtensionContractType,
    GetExtensionContractTypeOpts,
    SwapQuote,
    SwapQuoteConsumerError,
    SwapQuoteExecutionOpts,
} from '../types';

import { assert } from './assert';

export const swapQuoteConsumerUtils = {
    async getTakerAddressOrThrowAsync(
        provider: SupportedProvider,
        opts: Partial<SwapQuoteExecutionOpts>,
    ): Promise<string> {
        const takerAddress = await swapQuoteConsumerUtils.getTakerAddressAsync(provider, opts);
        if (takerAddress === undefined) {
            throw new Error(SwapQuoteConsumerError.NoAddressAvailable);
        } else {
            return takerAddress;
        }
    },
    async getTakerAddressAsync(
        provider: SupportedProvider,
        opts: Partial<SwapQuoteExecutionOpts>,
    ): Promise<string | undefined> {
        if (opts.takerAddress !== undefined) {
            return opts.takerAddress;
        } else {
            const web3Wrapper = new Web3Wrapper(provider);
            const availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
            const firstAvailableAddress = _.head(availableAddresses);
            if (firstAvailableAddress !== undefined) {
                return firstAvailableAddress;
            } else {
                return undefined;
            }
        }
    },
    async getEthAndWethBalanceAsync(
        provider: SupportedProvider,
        contractAddresses: ContractAddresses,
        takerAddress: string,
    ): Promise<[BigNumber, BigNumber]> {
        const weth = new WETH9Contract(contractAddresses.etherToken, provider);
        const web3Wrapper = new Web3Wrapper(provider);
        const ethBalance = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
        const wethBalance = await weth.balanceOf(takerAddress).callAsync();
        return [ethBalance, wethBalance];
    },
    isValidForwarderSwapQuote(swapQuote: SwapQuote, wethAssetData: string): boolean {
        return swapQuoteConsumerUtils.isValidForwarderSignedOrders(swapQuote.orders, wethAssetData);
    },
    isValidForwarderSignedOrders(orders: SignedOrder[], wethAssetData: string): boolean {
        return _.every(orders, order => swapQuoteConsumerUtils.isValidForwarderSignedOrder(order, wethAssetData));
    },
    isValidForwarderSignedOrder(order: SignedOrder, wethAssetData: string): boolean {
        return order.takerAssetData === wethAssetData;
    },
    async getExtensionContractTypeForSwapQuoteAsync(
        quote: SwapQuote,
        contractAddresses: ContractAddresses,
        provider: Provider,
        opts: Partial<GetExtensionContractTypeOpts>,
    ): Promise<ExtensionContractType> {
        const devUtils = new DevUtilsContract(contractAddresses.devUtils, provider);
        const wethAssetData = await devUtils.encodeERC20AssetData(contractAddresses.etherToken).callAsync();
        if (swapQuoteConsumerUtils.isValidForwarderSwapQuote(quote, wethAssetData)) {
            if (opts.takerAddress !== undefined) {
                assert.isETHAddressHex('takerAddress', opts.takerAddress);
            }
            const ethAmount =
                opts.ethAmount ||
                quote.worstCaseQuoteInfo.takerAssetAmount.plus(quote.worstCaseQuoteInfo.protocolFeeInWeiAmount);
            const takerAddress = await swapQuoteConsumerUtils.getTakerAddressAsync(provider, opts);
            const takerEthAndWethBalance =
                takerAddress !== undefined
                    ? await swapQuoteConsumerUtils.getEthAndWethBalanceAsync(provider, contractAddresses, takerAddress)
                    : [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT];
            // TODO(david): when considering if there is enough Eth balance, should account for gas costs.
            const isEnoughEthAndWethBalance = _.map(takerEthAndWethBalance, (balance: BigNumber) =>
                balance.isGreaterThanOrEqualTo(ethAmount),
            );
            if (isEnoughEthAndWethBalance[1]) {
                // should be more gas efficient to use exchange consumer, so if possible use it.
                return ExtensionContractType.None;
            } else if (isEnoughEthAndWethBalance[0] && !isEnoughEthAndWethBalance[1]) {
                return ExtensionContractType.Forwarder;
            }
            // Note: defaulting to forwarderConsumer if takerAddress is null or not enough balance of either wEth or Eth
            return ExtensionContractType.Forwarder;
        } else {
            return ExtensionContractType.None;
        }
    },
};
