import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { AbiDefinition, ContractAbi, MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    MarketBuySwapQuote,
    MarketBuySwapQuoteInfo,
    MarketSellSwapQuote,
    MarketSellSwapQuoteInfo,
    SwapQuote,
    SwapQuoteInfo,
} from '../types';

// tslint:disable:no-unnecessary-type-assertion
export const utils = {
    numberPercentageToEtherTokenAmountPercentage(percentage: number): BigNumber {
        return Web3Wrapper.toBaseUnitAmount(constants.ONE_AMOUNT, constants.ETHER_TOKEN_DECIMALS).multipliedBy(
            percentage,
        );
    },
    getMethodAbiFromContractAbi(abi: ContractAbi, name: string): MethodAbi | undefined {
        return _.find(
            abi,
            (def: AbiDefinition): boolean => {
                if (def.type === 'function') {
                    const methodDef = def as MethodAbi;
                    return methodDef.name === name;
                } else {
                    return false;
                }
            },
        ) as MethodAbi | undefined;
    },
    isSwapQuoteMarketBuy(quote: SwapQuote): quote is MarketBuySwapQuote {
        return (quote as MarketSellSwapQuote).takerAssetFillAmount !== undefined;
    },
    isSwapQuoteMarketSell(quote: SwapQuote): quote is MarketSellSwapQuote {
        return (quote as MarketBuySwapQuote).makerAssetFillAmount !== undefined;
    },
    isSwapQuoteInfoMarketBuy(quote: SwapQuoteInfo): quote is MarketBuySwapQuoteInfo {
        return (quote as MarketBuySwapQuoteInfo).takerTokenAmount !== undefined;
    },
    isSwapQuoteInfoMarketSell(quote: SwapQuoteInfo): quote is MarketSellSwapQuoteInfo {
        return (quote as MarketSellSwapQuoteInfo).makerTokenAmount !== undefined;
    },
};
