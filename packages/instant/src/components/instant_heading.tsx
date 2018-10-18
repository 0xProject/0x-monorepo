import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { SelectedAssetAmountInput } from '../containers/selected_asset_amount_input';
import { ColorOption } from '../style/theme';
import { AsyncProcessState } from '../types';
import { format } from '../util/format';

import { Container, Flex, Text } from './ui';

export interface InstantHeadingProps {
    selectedAssetAmount?: BigNumber;
    totalEthBaseAmount?: BigNumber;
    ethUsdPrice?: BigNumber;
    quoteState: AsyncProcessState;
}

const Placeholder = () => (
    <Text fontWeight="bold" fontColor={ColorOption.white}>
        &mdash;
    </Text>
);
const displaytotalEthBaseAmount = ({
    selectedAssetAmount,
    totalEthBaseAmount,
}: InstantHeadingProps): React.ReactNode => {
    if (_.isUndefined(selectedAssetAmount)) {
        return '0 ETH';
    }
    return format.ethBaseAmount(totalEthBaseAmount, 4, <Placeholder />);
};

const displayUsdAmount = ({
    totalEthBaseAmount,
    selectedAssetAmount,
    ethUsdPrice,
}: InstantHeadingProps): React.ReactNode => {
    if (_.isUndefined(selectedAssetAmount)) {
        return '$0.00';
    }
    return format.ethBaseAmountInUsd(totalEthBaseAmount, ethUsdPrice, 2, <Placeholder />);
};

const loadingOrAmount = (quoteState: AsyncProcessState, amount: React.ReactNode): React.ReactNode => {
    if (quoteState === AsyncProcessState.PENDING) {
        return (
            <Text fontWeight="bold" fontColor={ColorOption.white}>
                &hellip;loading
            </Text>
        );
    } else {
        return amount;
    }
};

export const InstantHeading: React.StatelessComponent<InstantHeadingProps> = props => (
    <Container backgroundColor={ColorOption.primaryColor} padding="20px" width="100%" borderRadius="3px 3px 0px 0px">
        <Container marginBottom="5px">
            <Text
                letterSpacing="1px"
                fontColor={ColorOption.white}
                opacity={0.7}
                fontWeight={500}
                textTransform="uppercase"
                fontSize="12px"
            >
                I want to buy
            </Text>
        </Container>
        <Flex direction="row" justify="space-between">
            <SelectedAssetAmountInput fontSize="45px" />
            <Flex direction="column" justify="space-between">
                <Container marginBottom="5px">
                    <Text fontSize="16px" fontColor={ColorOption.white} fontWeight={500}>
                        {loadingOrAmount(props.quoteState, displaytotalEthBaseAmount(props))}
                    </Text>
                </Container>
                <Text fontSize="16px" fontColor={ColorOption.white} opacity={0.7}>
                    {loadingOrAmount(props.quoteState, displayUsdAmount(props))}
                </Text>
            </Flex>
        </Flex>
    </Container>
);
