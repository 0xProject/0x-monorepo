import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as React from 'react';

import { ethDecimals } from '../constants';
import { SelectedAssetAmountInput } from '../containers/selected_asset_amount_input';
import { ColorOption } from '../style/theme';
import { format } from '../util/format';

import { Container, Flex, Text } from './ui';

export interface InstantHeadingProps {
    selectedAssetAmount?: BigNumber;
    totalEthBaseAmount?: BigNumber;
    ethUsdPrice?: BigNumber;
}

const displaytotalEthBaseAmount = ({ selectedAssetAmount, totalEthBaseAmount }: InstantHeadingProps): string => {
    if (_.isUndefined(selectedAssetAmount)) {
        return '0 ETH';
    }
    return format.ethBaseAmount(totalEthBaseAmount, 4, '...loading');
};

const displayUsdAmount = ({ totalEthBaseAmount, selectedAssetAmount, ethUsdPrice }: InstantHeadingProps): string => {
    if (_.isUndefined(selectedAssetAmount)) {
        return '$0.00';
    }
    return format.ethBaseAmountInUsd(totalEthBaseAmount, ethUsdPrice, 2, '...loading');
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
            <Container>
                <SelectedAssetAmountInput fontSize="45px" />
                <Container display="inline-block" marginLeft="10px">
                    <Text fontSize="45px" fontColor={ColorOption.white} textTransform="uppercase">
                        zrx
                    </Text>
                </Container>
            </Container>
            <Flex direction="column" justify="space-between">
                <Container marginBottom="5px">
                    <Text fontSize="16px" fontColor={ColorOption.white} fontWeight={500}>
                        {displaytotalEthBaseAmount(props)}
                    </Text>
                </Container>
                <Text fontSize="16px" fontColor={ColorOption.white} opacity={0.7}>
                    {displayUsdAmount(props)}
                </Text>
            </Flex>
        </Flex>
    </Container>
);
