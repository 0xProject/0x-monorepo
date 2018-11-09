import { AssetBuyer, AssetBuyerError, BuyQuote } from '@0x/asset-buyer';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { AffiliateInfo, OrderProcessState, ZeroExInstantError } from '../types';

import { BuyButton } from './buy_button';
import { PlacingOrderButton } from './placing_order_button';
import { SecondaryButton } from './secondary_button';

import { Button } from './ui/button';
import { Flex } from './ui/flex';

export interface BuyOrderStateButtonProps {
    accountAddress?: string;
    accountEthBalanceInWei?: BigNumber;
    buyQuote?: BuyQuote;
    buyOrderProcessingState: OrderProcessState;
    assetBuyer: AssetBuyer;
    web3Wrapper: Web3Wrapper;
    affiliateInfo?: AffiliateInfo;
    onViewTransaction: () => void;
    onValidationPending: (buyQuote: BuyQuote) => void;
    onValidationFail: (buyQuote: BuyQuote, errorMessage: AssetBuyerError | ZeroExInstantError) => void;
    onSignatureDenied: (buyQuote: BuyQuote) => void;
    onBuyProcessing: (buyQuote: BuyQuote, txHash: string, startTimeUnix: number, expectedEndTimeUnix: number) => void;
    onBuySuccess: (buyQuote: BuyQuote, txHash: string) => void;
    onBuyFailure: (buyQuote: BuyQuote, txHash: string) => void;
    onRetry: () => void;
}

export const BuyOrderStateButtons: React.StatelessComponent<BuyOrderStateButtonProps> = props => {
    if (props.buyOrderProcessingState === OrderProcessState.Failure) {
        return (
            <Flex justify="space-between">
                <Button width="48%" onClick={props.onRetry} fontColor={ColorOption.white} fontSize="16px">
                    Back
                </Button>
                <SecondaryButton width="48%" onClick={props.onViewTransaction}>
                    Details
                </SecondaryButton>
            </Flex>
        );
    } else if (
        props.buyOrderProcessingState === OrderProcessState.Success ||
        props.buyOrderProcessingState === OrderProcessState.Processing
    ) {
        return <SecondaryButton onClick={props.onViewTransaction}>View Transaction</SecondaryButton>;
    } else if (props.buyOrderProcessingState === OrderProcessState.Validating) {
        return <PlacingOrderButton />;
    }

    return (
        <BuyButton
            accountAddress={props.accountAddress}
            accountEthBalanceInWei={props.accountEthBalanceInWei}
            buyQuote={props.buyQuote}
            assetBuyer={props.assetBuyer}
            web3Wrapper={props.web3Wrapper}
            affiliateInfo={props.affiliateInfo}
            onValidationPending={props.onValidationPending}
            onValidationFail={props.onValidationFail}
            onSignatureDenied={props.onSignatureDenied}
            onBuyProcessing={props.onBuyProcessing}
            onBuySuccess={props.onBuySuccess}
            onBuyFailure={props.onBuyFailure}
        />
    );
};
