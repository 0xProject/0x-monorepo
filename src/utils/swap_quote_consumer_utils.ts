import { ContractWrappers } from '@0x/contract-wrappers';
import { MarketOperation, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { SupportedProvider, Web3Wrapper } from '@0x/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import { ExchangeSwapQuoteConsumer } from '../quote_consumers/exchange_swap_quote_consumer';
import { ForwarderSwapQuoteConsumer } from '../quote_consumers/forwarder_swap_quote_consumer';
import {
    ConsumerType,
    SmartContractParams,
    SwapQuote,
    SwapQuoteConsumerBase,
    SwapQuoteConsumerError,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
} from '../types';

import { assert } from './assert';
import { assetDataUtils } from './asset_data_utils';

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
        contractWrappers: ContractWrappers,
        takerAddress: string,
    ): Promise<[BigNumber, BigNumber]> {
        const web3Wrapper = new Web3Wrapper(provider);
        const wethAddress = contractWrappers.forwarder.etherTokenAddress;
        const ethBalance = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
        const wethBalance = await contractWrappers.erc20Token.getBalanceAsync(wethAddress, takerAddress);
        return [ethBalance, wethBalance];
    },
    isValidForwarderSwapQuote(swapQuote: SwapQuote, wethAssetData: string): boolean {
        return (
            swapQuoteConsumerUtils.isValidForwarderSignedOrders(swapQuote.orders, wethAssetData) &&
            swapQuoteConsumerUtils.isValidForwarderSignedOrders(swapQuote.feeOrders, wethAssetData)
        );
    },
    isValidForwarderSignedOrders(orders: SignedOrder[], wethAssetData: string): boolean {
        return _.every(orders, order => swapQuoteConsumerUtils.isValidForwarderSignedOrder(order, wethAssetData));
    },
    isValidForwarderSignedOrder(order: SignedOrder, wethAssetData: string): boolean {
        return order.takerAssetData === wethAssetData;
    },
    optimizeOrdersForMarketExchangeOperation(orders: SignedOrder[], operation: MarketOperation): SignedOrder[] {
        return _.map(orders, (order: SignedOrder, index: number) => {
            const optimizedOrder = _.clone(order);
            if (operation === MarketOperation.Sell && index !== 0) {
                optimizedOrder.takerAssetData = constants.NULL_BYTES;
            } else if (index !== 0) {
                optimizedOrder.makerAssetData = constants.NULL_BYTES;
            }
            return optimizedOrder;
        });
    },
    async getConsumerForSwapQuoteAsync(
        quote: SwapQuote,
        contractWrappers: ContractWrappers,
        provider: Provider,
        opts: Partial<SwapQuoteGetOutputOpts>,
    ): Promise<ConsumerType> {
        const wethAssetData = assetDataUtils.getEtherTokenAssetData(contractWrappers);
        if (swapQuoteConsumerUtils.isValidForwarderSwapQuote(quote, wethAssetData)) {
            if (opts.takerAddress !== undefined) {
                assert.isETHAddressHex('takerAddress', opts.takerAddress);
            }
            const ethAmount = opts.ethAmount || quote.worstCaseQuoteInfo.totalTakerTokenAmount;
            const takerAddress = await swapQuoteConsumerUtils.getTakerAddressAsync(provider, opts);
            const takerEthAndWethBalance =
                takerAddress !== undefined
                    ? await swapQuoteConsumerUtils.getEthAndWethBalanceAsync(provider, contractWrappers, takerAddress)
                    : [constants.ZERO_AMOUNT, constants.ZERO_AMOUNT];
            // TODO(david): when considering if there is enough Eth balance, should account for gas costs.
            const isEnoughEthAndWethBalance = _.map(takerEthAndWethBalance, (balance: BigNumber) =>
                balance.isGreaterThanOrEqualTo(ethAmount),
            );
            if (isEnoughEthAndWethBalance[1]) {
                // should be more gas efficient to use exchange consumer, so if possible use it.
                return ConsumerType.Exchange;
            } else if (isEnoughEthAndWethBalance[0] && !isEnoughEthAndWethBalance[1]) {
                return ConsumerType.Forwarder;
            }
            // Note: defaulting to forwarderConsumer if takerAddress is null or not enough balance of either wEth or Eth
            return ConsumerType.Forwarder;
        } else {
            return ConsumerType.Exchange;
        }
    },
};
