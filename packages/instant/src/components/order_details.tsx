import { BuyQuoteInfo } from '@0xproject/asset-buyer';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { format } from '../util/format';

import { Container, Flex, Text } from './ui';

export interface OrderDetailsProps {
    buyQuoteInfo?: BuyQuoteInfo;
    ethUsdPrice?: BigNumber;
}

export class OrderDetails extends React.Component<OrderDetailsProps> {
    public render(): React.ReactNode {
        const { buyQuoteInfo, ethUsdPrice } = this.props;
        const ethAssetPrice = _.get(buyQuoteInfo, 'ethPerAssetPrice');
        const ethTokenFee = _.get(buyQuoteInfo, 'feeEthAmount');
        const totalEthAmount = _.get(buyQuoteInfo, 'totalEthAmount');
        return (
            <Container padding="20px" width="100%">
                <Container marginBottom="10px">
                    <Text
                        letterSpacing="1px"
                        fontColor={ColorOption.primaryColor}
                        fontWeight={600}
                        textTransform="uppercase"
                        fontSize="14px"
                    >
                        Order Details
                    </Text>
                </Container>
                <OrderDetailsRow
                    name="Token Price"
                    ethAmount={ethAssetPrice}
                    ethUsdPrice={ethUsdPrice}
                    shouldConvertEthToUnitAmount={false}
                />
                <OrderDetailsRow name="Fee" ethAmount={ethTokenFee} ethUsdPrice={ethUsdPrice} />
                <OrderDetailsRow
                    name="Total Cost"
                    ethAmount={totalEthAmount}
                    ethUsdPrice={ethUsdPrice}
                    shouldEmphasize={true}
                />
            </Container>
        );
    }
}

export interface OrderDetailsRowProps {
    name: string;
    ethAmount?: BigNumber;
    shouldConvertEthToUnitAmount?: boolean;
    ethUsdPrice?: BigNumber;
    shouldEmphasize?: boolean;
}

export const OrderDetailsRow: React.StatelessComponent<OrderDetailsRowProps> = ({
    name,
    ethAmount,
    shouldConvertEthToUnitAmount,
    ethUsdPrice,
    shouldEmphasize,
}) => {
    const fontWeight = shouldEmphasize ? 700 : 400;
    const usdFormatter = shouldConvertEthToUnitAmount ? format.ethBaseAmountInUsd : format.ethUnitAmountInUsd;
    const ethFormatter = shouldConvertEthToUnitAmount ? format.ethBaseAmount : format.ethUnitAmount;
    return (
        <Container padding="10px 0px" borderTop="1px dashed" borderColor={ColorOption.feintGrey}>
            <Flex justify="space-between">
                <Text fontWeight={fontWeight} fontColor={ColorOption.grey}>
                    {name}
                </Text>
                <Container>
                    <Container marginRight="3px" display="inline-block">
                        <Text fontColor={ColorOption.lightGrey}>({usdFormatter(ethAmount, ethUsdPrice)})</Text>
                    </Container>
                    <Text fontWeight={fontWeight} fontColor={ColorOption.grey}>
                        {ethFormatter(ethAmount)}
                    </Text>
                </Container>
            </Flex>
        </Container>
    );
};

OrderDetailsRow.defaultProps = {
    shouldEmphasize: false,
    shouldConvertEthToUnitAmount: true,
};

OrderDetailsRow.displayName = 'OrderDetailsRow';
