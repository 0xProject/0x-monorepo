import { MarketBuySwapQuote, SwapQuoteConsumer, SwapQuoteConsumerError, SwapQuoter } from '@0x/asset-swapper';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { AffiliateInfo, Asset, OrderProcessState, ZeroExInstantError } from '../types';

import { BuyButton } from './buy_button';
import { PlacingOrderButton } from './placing_order_button';
import { SecondaryButton } from './secondary_button';

import { Button } from './ui/button';
import { Flex } from './ui/flex';

export interface BuyOrderStateButtonProps {
    accountAddress?: string;
    accountEthBalanceInWei?: BigNumber;
    swapQuote?: MarketBuySwapQuote;
    swapOrderProcessingState: OrderProcessState;
    swapQuoter: SwapQuoter;
    swapQuoteConsumer: SwapQuoteConsumer;
    web3Wrapper: Web3Wrapper;
    affiliateInfo?: AffiliateInfo;
    selectedAsset?: Asset;
    onViewTransaction: () => void;
    onValidationPending: (swapQuote: MarketBuySwapQuote) => void;
    onValidationFail: (
        swapQuote: MarketBuySwapQuote,
        errorMessage: SwapQuoteConsumerError | ZeroExInstantError,
    ) => void;
    onSignatureDenied: (swapQuote: MarketBuySwapQuote) => void;
    onBuyProcessing: (
        swapQuote: MarketBuySwapQuote,
        txHash: string,
        startTimeUnix: number,
        expectedEndTimeUnix: number,
    ) => void;
    onBuySuccess: (swapQuote: MarketBuySwapQuote, txHash: string) => void;
    onBuyFailure: (swapQuote: MarketBuySwapQuote, txHash: string) => void;
    onRetry: () => void;
}

export const BuyOrderStateButtons: React.StatelessComponent<BuyOrderStateButtonProps> = props => {
    if (props.swapOrderProcessingState === OrderProcessState.Failure) {
        return (
            <Flex justify="space-between">
                <Button width="48%" onClick={props.onRetry} fontColor={ColorOption.white}>
                    Back
                </Button>
                <SecondaryButton width="48%" onClick={props.onViewTransaction}>
                    Details
                </SecondaryButton>
            </Flex>
        );
    } else if (
        props.swapOrderProcessingState === OrderProcessState.Success ||
        props.swapOrderProcessingState === OrderProcessState.Processing
    ) {
        return <SecondaryButton onClick={props.onViewTransaction}>View Transaction</SecondaryButton>;
    } else if (props.swapOrderProcessingState === OrderProcessState.Validating) {
        return <PlacingOrderButton />;
    }

    return (
        <BuyButton
            accountAddress={props.accountAddress}
            accountEthBalanceInWei={props.accountEthBalanceInWei}
            swapQuote={props.swapQuote}
            swapQuoter={props.swapQuoter}
            swapQuoteConsumer={props.swapQuoteConsumer}
            web3Wrapper={props.web3Wrapper}
            affiliateInfo={props.affiliateInfo}
            selectedAsset={props.selectedAsset}
            onValidationPending={props.onValidationPending}
            onValidationFail={props.onValidationFail}
            onSignatureDenied={props.onSignatureDenied}
            onBuyProcessing={props.onBuyProcessing}
            onBuySuccess={props.onBuySuccess}
            onBuyFailure={props.onBuyFailure}
        />
    );
};

BuyOrderStateButtons.displayName = 'BuyOrderStateButtons';
