import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { AffiliateInfo, Asset, OrderProcessState, ZeroExAPIQuoteResponse, ZeroExInstantError } from '../types';

import { BuyButton } from './buy_button';
import { PlacingOrderButton } from './placing_order_button';
import { SecondaryButton } from './secondary_button';

import { Button } from './ui/button';
import { Flex } from './ui/flex';

export interface BuyOrderStateButtonProps {
    accountAddress?: string;
    accountEthBalanceInWei?: BigNumber;
    quote?: ZeroExAPIQuoteResponse;
    swapOrderProcessingState: OrderProcessState;
    web3Wrapper: Web3Wrapper;
    affiliateInfo?: AffiliateInfo;
    selectedAsset?: Asset;
    onViewTransaction: () => void;
    onValidationPending: (quote: ZeroExAPIQuoteResponse) => void;
    onValidationFail: (
        swapQuote: ZeroExAPIQuoteResponse,
        errorMessage: ZeroExInstantError, // TODO
    ) => void;
    onSignatureDenied: (quote: ZeroExAPIQuoteResponse) => void;
    onBuyProcessing: (
        quote: ZeroExAPIQuoteResponse,
        txHash: string,
        startTimeUnix: number,
        expectedEndTimeUnix: number,
    ) => void;
    onBuySuccess: (quote: ZeroExAPIQuoteResponse, txHash: string) => void;
    onBuyFailure: (quote: ZeroExAPIQuoteResponse, txHash: string) => void;
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
            quote={props.quote}
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
