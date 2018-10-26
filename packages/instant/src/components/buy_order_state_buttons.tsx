import { AssetBuyer, BuyQuote } from '@0x/asset-buyer';
import * as React from 'react';

import { BuyButton } from '../components/buy_button';
import { SecondaryButton } from '../components/secondary_button';
import { Flex } from '../components/ui/flex';

import { PlacingOrderButton } from '../components/placing_order_button';
import { ColorOption } from '../style/theme';
import { OrderProcessState } from '../types';

import { Button } from './ui/button';
import { Text } from './ui/text';

export interface BuyOrderStateButtonProps {
    buyQuote?: BuyQuote;
    buyOrderProcessingState: OrderProcessState;
    assetBuyer?: AssetBuyer;
    onViewTransaction: () => void;
    onAwaitingSignature: (buyQuote: BuyQuote) => void;
    onSignatureDenied: (buyQuote: BuyQuote, error: Error) => void;
    onBuyProcessing: (buyQuote: BuyQuote, txHash: string) => void;
    onBuySuccess: (buyQuote: BuyQuote, txHash: string) => void;
    onBuyFailure: (buyQuote: BuyQuote, txHash: string) => void;
    onRetry: () => void;
}

// TODO: rename to buttons
export const BuyOrderStateButtons: React.StatelessComponent<BuyOrderStateButtonProps> = props => {
    if (props.buyOrderProcessingState === OrderProcessState.FAILURE) {
        return (
            <Flex justify="space-between">
                <Button width="48%" onClick={props.onRetry}>
                    <Text fontColor={ColorOption.white} fontWeight={600} fontSize="16px">
                        Back
                    </Text>
                </Button>
                <SecondaryButton width="48%" onClick={props.onViewTransaction}>
                    Details
                </SecondaryButton>
            </Flex>
        );
    } else if (
        props.buyOrderProcessingState === OrderProcessState.SUCCESS ||
        props.buyOrderProcessingState === OrderProcessState.PROCESSING
    ) {
        return <SecondaryButton onClick={props.onViewTransaction}>View Transaction</SecondaryButton>;
    } else if (props.buyOrderProcessingState === OrderProcessState.AWAITING_SIGNATURE) {
        return <PlacingOrderButton />;
    }

    return (
        <BuyButton
            buyQuote={props.buyQuote}
            assetBuyer={props.assetBuyer}
            onAwaitingSignature={props.onAwaitingSignature}
            onSignatureDenied={props.onSignatureDenied}
            onBuyProcessing={props.onBuyProcessing}
            onBuySuccess={props.onBuySuccess}
            onBuyFailure={props.onBuyFailure}
        />
    );
};
