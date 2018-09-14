import { ContractWrappers } from '@0xproject/contract-wrappers';
import { marketUtils } from '@0xproject/order-utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import { Provider } from 'ethereum-types';

import { constants } from '../constants';
import { AssetBuyerError, BuyQuote, BuyQuoteRequest } from '../types';

const SLIPPAGE_PERCENTAGE = new BigNumber(0.2); // 20% slippage protection, possibly move this into request interface

export interface AssetBuyerConfig {
    orders: SignedOrder[];
    feeOrders: SignedOrder[];
    remainingFillableMakerAssetAmounts?: BigNumber[];
    remainingFillableFeeAmounts?: BigNumber[];
    networkId?: number;
}

export class AssetBuyer {
    public readonly provider: Provider;
    public readonly config: AssetBuyerConfig;
    private _contractWrappers: ContractWrappers;
    constructor(provider: Provider, config: AssetBuyerConfig) {
        this.provider = provider;
        this.config = config;
        const networkId = this.config.networkId || constants.MAINNET_NETWORK_ID;
        this._contractWrappers = new ContractWrappers(this.provider, {
            networkId,
        });
    }
    /**
     * Given a BuyQuoteRequest, returns a BuyQuote containing all information relevant to fulfilling the buy. Pass the BuyQuote
     * to executeBuyQuoteAsync to execute the buy.
     * @param   buyQuoteRequest     An object that conforms to BuyQuoteRequest. See type definition for more information.
     * @return  An object that conforms to BuyQuote that satisfies the request. See type definition for more information.
     */
    public getBuyQuote(buyQuoteRequest: BuyQuoteRequest): BuyQuote {
        const { assetBuyAmount, feePercentage } = buyQuoteRequest;
        const { orders, feeOrders, remainingFillableMakerAssetAmounts, remainingFillableFeeAmounts } = this.config;
        // TODO: optimization
        // make the slippage percentage customizable
        const slippageBufferAmount = assetBuyAmount.mul(SLIPPAGE_PERCENTAGE).round();
        const { resultOrders, remainingFillAmount } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(
            orders,
            assetBuyAmount,
            {
                remainingFillableMakerAssetAmounts,
                slippageBufferAmount,
            },
        );
        if (remainingFillAmount.gt(constants.ZERO_AMOUNT)) {
            throw new Error(AssetBuyerError.InsufficientAssetLiquidity);
        }
        // TODO: optimization
        // update this logic to find the minimum amount of feeOrders to cover the worst case as opposed to
        // finding order that cover all fees, this will help with estimating ETH and minimizing gas usage
        const { resultFeeOrders, remainingFeeAmount } = marketUtils.findFeeOrdersThatCoverFeesForTargetOrders(
            resultOrders,
            feeOrders,
            {
                remainingFillableMakerAssetAmounts,
                remainingFillableFeeAmounts,
            },
        );
        if (remainingFeeAmount.gt(constants.ZERO_AMOUNT)) {
            throw new Error(AssetBuyerError.InsufficientZrxLiquidity);
        }
        const assetData = orders[0].makerAssetData;
        // TODO: critical
        // calculate minRate and maxRate by calculating min and max eth usage and then dividing into
        // assetBuyAmount to get assetData / WETH
        return {
            assetData,
            orders: resultOrders,
            feeOrders: resultFeeOrders,
            minRate: constants.ZERO_AMOUNT,
            maxRate: constants.ZERO_AMOUNT,
            assetBuyAmount,
            feePercentage,
        };
    }
    /**
     * Given a BuyQuote and desired rate, attempt to execute the buy.
     * @param   buyQuote        An object that conforms to BuyQuote. See type definition for more information.
     * @param   rate            The desired rate to execute the buy at. Affects the amount of ETH sent with the transaction, defaults to buyQuote.maxRate.
     * @param   takerAddress    The address to perform the buy. Defaults to the first available address from the provider.
     * @param   feeRecipient    The address where affiliate fees are sent. Defaults to null address (0x000...000).
     * @return  A promise of the txHash.
     */
    public async executeBuyQuoteAsync(
        buyQuote: BuyQuote,
        rate?: BigNumber,
        takerAddress?: string,
        feeRecipient: string = constants.NULL_ADDRESS,
    ): Promise<string> {
        const { orders, feeOrders, feePercentage, assetBuyAmount, maxRate } = buyQuote;
        // if no takerAddress is provided, try to get one from the provider
        let finalTakerAddress;
        if (!_.isUndefined(takerAddress)) {
            finalTakerAddress = takerAddress;
        } else {
            const web3Wrapper = new Web3Wrapper(this.provider);
            const availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
            const firstAvailableAddress = _.head(availableAddresses);
            if (!_.isUndefined(firstAvailableAddress)) {
                finalTakerAddress = firstAvailableAddress;
            } else {
                throw new Error(AssetBuyerError.NoAddressAvailable);
            }
        }
        // if no rate is provided, default to the maxRate from buyQuote
        const desiredRate = rate || maxRate;
        // calculate how much eth is required to buy assetBuyAmount at the desired rate
        const ethAmount = assetBuyAmount.dividedToIntegerBy(desiredRate);
        const txHash = await this._contractWrappers.forwarder.marketBuyOrdersWithEthAsync(
            orders,
            assetBuyAmount,
            finalTakerAddress,
            ethAmount,
            feeOrders,
            feePercentage,
            feeRecipient,
        );
        return txHash;
    }
}
