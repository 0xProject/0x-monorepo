import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { SelectedAssetAmountInput } from '../containers/selected_asset_amount_input';
import { ColorOption } from '../style/theme';
import { AsyncProcessState, OrderState } from '../types';
import { format } from '../util/format';

import { AmountPlaceholder } from './amount_placeholder';
import { Container, Flex, Text } from './ui';
import { Icon } from './ui/icon';

export interface InstantHeadingProps {
    selectedAssetAmount?: BigNumber;
    totalEthBaseAmount?: BigNumber;
    ethUsdPrice?: BigNumber;
    quoteRequestState: AsyncProcessState;
    buyOrderState: OrderState;
}

const PLACEHOLDER_COLOR = ColorOption.white;
const ICON_WIDTH = 34;
const ICON_HEIGHT = 34;
const ICON_COLOR = ColorOption.white;

export class InstantHeading extends React.Component<InstantHeadingProps, {}> {
    public render(): React.ReactNode {
        const iconOrAmounts = this._renderIcon() || this._renderAmountsSection();
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
                    <Flex height="60px">
                        <SelectedAssetAmountInput startingFontSizePx={38} />
                    </Flex>
                    <Flex direction="column" justify="space-between">
                        {iconOrAmounts}
                    </Flex>
                </Flex>
            </Container>
        );
    }

    private _renderAmountsSection(): React.ReactNode {
        return (
            <Container>
                <Container marginBottom="5px">{this._placeholderOrAmount(this._ethAmount)}</Container>
                <Container opacity={0.7}>{this._placeholderOrAmount(this._dollarAmount)}</Container>
            </Container>
        );
    }

    private _renderIcon(): React.ReactNode {
        const processState = this.props.buyOrderState.processState;

        if (processState === AsyncProcessState.FAILURE) {
            return <Icon icon={'failed'} width={ICON_WIDTH} height={ICON_HEIGHT} color={ICON_COLOR} />;
        } else if (processState === AsyncProcessState.SUCCESS) {
            return <Icon icon={'success'} width={ICON_WIDTH} height={ICON_HEIGHT} color={ICON_COLOR} />;
        }
        return undefined;
    }

    private _renderTopText(): React.ReactNode {
        const processState = this.props.buyOrderState.processState;
        if (processState === AsyncProcessState.FAILURE) {
            return 'Order failed';
        } else if (processState === AsyncProcessState.SUCCESS) {
            return 'Tokens received!';
        }

        return 'I want to buy';
    }

    private _placeholderOrAmount(amountFunction: () => React.ReactNode): React.ReactNode {
        if (this.props.quoteRequestState === AsyncProcessState.PENDING) {
            return <AmountPlaceholder isPulsating={true} color={PLACEHOLDER_COLOR} />;
        }
        if (_.isUndefined(this.props.selectedAssetAmount)) {
            return <AmountPlaceholder isPulsating={false} color={PLACEHOLDER_COLOR} />;
        }
        return amountFunction();
    }

    private readonly _ethAmount = (): React.ReactNode => {
        return (
            <Text fontSize="16px" fontColor={ColorOption.white} fontWeight={500}>
                {format.ethBaseAmount(
                    this.props.totalEthBaseAmount,
                    4,
                    <AmountPlaceholder isPulsating={false} color={PLACEHOLDER_COLOR} />,
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
