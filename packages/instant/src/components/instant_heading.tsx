import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { SelectedAssetAmountInput } from '../containers/selected_asset_amount_input';
import { ColorOption } from '../style/theme';
import { AsyncProcessState } from '../types';
import { format } from '../util/format';

import { AmountPlaceholder } from './amount_placeholder';
import { Container, Flex, Text } from './ui';

export interface InstantHeadingProps {
    selectedAssetAmount?: BigNumber;
    totalEthBaseAmount?: BigNumber;
    ethUsdPrice?: BigNumber;
    quoteRequestState: AsyncProcessState;
    buyOrderState: AsyncProcessState;
}

const placeholderColor = ColorOption.white;
export class InstantHeading extends React.Component<InstantHeadingProps, {}> {
    public render(): React.ReactNode {
        return (
            <Container
                backgroundColor={ColorOption.primaryColor}
                padding="20px"
                width="100%"
                borderRadius="3px 3px 0px 0px"
            >
                <Container marginBottom="5px">
                    <Text
                        letterSpacing="1px"
                        fontColor={ColorOption.white}
                        opacity={0.7}
                        fontWeight={500}
                        textTransform="uppercase"
                        fontSize="12px"
                    >
                        {this._renderTopText()}
                    </Text>
                </Container>
                <Flex direction="row" justify="space-between">
                    <SelectedAssetAmountInput fontSize="45px" />
                    <Flex direction="column" justify="space-between">
                        <Container marginBottom="5px">{this._placeholderOrAmount(this._ethAmount)}</Container>
                        <Container opacity={0.7}>{this._placeholderOrAmount(this._dollarAmount)}</Container>
                    </Flex>
                </Flex>
            </Container>
        );
    }

    private _renderTopText(): React.ReactNode {
        if (this.props.buyOrderState === AsyncProcessState.FAILURE) {
            return 'Order failed';
        }

        return 'I want to buy';
    }

    private _placeholderOrAmount(amountFunction: () => React.ReactNode): React.ReactNode {
        if (this.props.quoteRequestState === AsyncProcessState.PENDING) {
            return <AmountPlaceholder isPulsating={true} color={placeholderColor} />;
        }
        if (_.isUndefined(this.props.selectedAssetAmount)) {
            return <AmountPlaceholder isPulsating={false} color={placeholderColor} />;
        }
        return amountFunction();
    }

    private readonly _ethAmount = (): React.ReactNode => {
        return (
            <Text fontSize="16px" fontColor={ColorOption.white} fontWeight={500}>
                {format.ethBaseAmount(
                    this.props.totalEthBaseAmount,
                    4,
                    <AmountPlaceholder isPulsating={false} color={placeholderColor} />,
                )}
            </Text>
        );
    };

    private readonly _dollarAmount = (): React.ReactNode => {
        return (
            <Text fontSize="16px" fontColor={ColorOption.white}>
                {format.ethBaseAmountInUsd(
                    this.props.totalEthBaseAmount,
                    this.props.ethUsdPrice,
                    2,
                    <AmountPlaceholder isPulsating={false} color={ColorOption.white} />,
                )}
            </Text>
        );
    };
}
