import { BuyQuoteInfo } from '@0x/asset-buyer';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { oc } from 'ts-optchain';

import { ColorOption } from '../style/theme';
import { format } from '../util/format';

import { AmountPlaceholder } from './amount_placeholder';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Text } from './ui/text';

export interface OrderDetailsProps {
    buyQuoteInfo?: BuyQuoteInfo;
    ethUsdPrice?: BigNumber;
    isLoading: boolean;
}
export class OrderDetails extends React.Component<OrderDetailsProps> {
    public render(): React.ReactNode {
        const { buyQuoteInfo, ethUsdPrice } = this.props;
        const buyQuoteAccessor = oc(buyQuoteInfo);
        const ethAssetPrice = buyQuoteAccessor.ethPerAssetPrice();
        const ethTokenFee = buyQuoteAccessor.feeEthAmount();
        const totalEthAmount = buyQuoteAccessor.totalEthAmount();
        return (
            <Container padding="20px" width="100%" flexGrow={1}>
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
                <EthAmountRow
                    rowLabel="Token Price"
                    ethAmount={ethAssetPrice}
                    ethUsdPrice={ethUsdPrice}
                    isEthAmountInBaseUnits={false}
                    isLoading={this.props.isLoading}
                />
                <EthAmountRow
                    rowLabel="Fee"
                    ethAmount={ethTokenFee}
                    ethUsdPrice={ethUsdPrice}
                    isLoading={this.props.isLoading}
                />
                <EthAmountRow
                    rowLabel="Total Cost"
                    ethAmount={totalEthAmount}
                    ethUsdPrice={ethUsdPrice}
                    shouldEmphasize={true}
                    isLoading={this.props.isLoading}
                />
            </Container>
        );
    }
}

export interface EthAmountRowProps {
    rowLabel: string;
    ethAmount?: BigNumber;
    isEthAmountInBaseUnits?: boolean;
    ethUsdPrice?: BigNumber;
    shouldEmphasize?: boolean;
    isLoading: boolean;
}

export class EthAmountRow extends React.Component<EthAmountRowProps> {
    public static defaultProps = {
        shouldEmphasize: false,
        isEthAmountInBaseUnits: true,
    };
    public render(): React.ReactNode {
        const { rowLabel, ethAmount, isEthAmountInBaseUnits, shouldEmphasize, isLoading } = this.props;

        const fontWeight = shouldEmphasize ? 700 : 400;
        const ethFormatter = isEthAmountInBaseUnits ? format.ethBaseAmount : format.ethUnitAmount;
        return (
            <Container padding="10px 0px" borderTop="1px dashed" borderColor={ColorOption.feintGrey}>
                <Flex justify="space-between">
                    <Text fontWeight={fontWeight} fontColor={ColorOption.grey}>
                        {rowLabel}
                    </Text>
                    <Container>
                        {this._renderUsdSection()}
                        <Text fontWeight={fontWeight} fontColor={ColorOption.grey}>
                            {ethFormatter(
                                ethAmount,
                                4,
                                <Container opacity={0.5}>
                                    <AmountPlaceholder color={ColorOption.lightGrey} isPulsating={isLoading} />
                                </Container>,
                            )}
                        </Text>
                    </Container>
                </Flex>
            </Container>
        );
    }
    private _renderUsdSection(): React.ReactNode {
        const usdFormatter = this.props.isEthAmountInBaseUnits ? format.ethBaseAmountInUsd : format.ethUnitAmountInUsd;
        const shouldHideUsdPriceSection = _.isUndefined(this.props.ethUsdPrice) || _.isUndefined(this.props.ethAmount);
        return shouldHideUsdPriceSection ? null : (
            <Container marginRight="3px" display="inline-block">
                <Text fontColor={ColorOption.lightGrey}>
                    ({usdFormatter(this.props.ethAmount, this.props.ethUsdPrice)})
                </Text>
            </Container>
        );
    }
}
