import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { SelectedERC20AssetAmountInput } from '../containers/selected_erc20_asset_amount_input';
import { ColorOption } from '../style/theme';
import { AsyncProcessState, ERC20Asset, OrderProcessState, OrderState } from '../types';
import { format } from '../util/format';

import { AmountPlaceholder } from './amount_placeholder';
import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Icon } from './ui/icon';
import { Spinner } from './ui/spinner';
import { Text } from './ui/text';

export interface InstantHeadingProps {
    selectedAssetAmount?: BigNumber;
    totalEthBaseAmount?: BigNumber;
    ethUsdPrice?: BigNumber;
    quoteRequestState: AsyncProcessState;
    buyOrderState: OrderState;
    onSelectAssetClick?: (asset?: ERC20Asset) => void;
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
                        <SelectedERC20AssetAmountInput
                            startingFontSizePx={38}
                            onSelectAssetClick={this.props.onSelectAssetClick}
                        />
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
                <Container marginBottom="5px">{this._renderPlaceholderOrAmount(this._renderEthAmount)}</Container>
                <Container opacity={0.7}>{this._renderPlaceholderOrAmount(this._renderDollarAmount)}</Container>
            </Container>
        );
    }

    private _renderIcon(): React.ReactNode {
        const processState = this.props.buyOrderState.processState;

        if (processState === OrderProcessState.Failure) {
            return <Icon icon="failed" width={ICON_WIDTH} height={ICON_HEIGHT} color={ICON_COLOR} />;
        } else if (processState === OrderProcessState.Processing) {
            return <Spinner widthPx={ICON_HEIGHT} heightPx={ICON_HEIGHT} />;
        } else if (processState === OrderProcessState.Success) {
            return <Icon icon="success" width={ICON_WIDTH} height={ICON_HEIGHT} color={ICON_COLOR} />;
        }
        return undefined;
    }

    private _renderTopText(): React.ReactNode {
        const processState = this.props.buyOrderState.processState;
        if (processState === OrderProcessState.Failure) {
            return 'Order failed';
        } else if (processState === OrderProcessState.Processing) {
            return 'Processing Order...';
        } else if (processState === OrderProcessState.Success) {
            return 'Tokens received!';
        }

        return 'I want to buy';
    }

    private _renderPlaceholderOrAmount(amountFunction: () => React.ReactNode): React.ReactNode {
        if (this.props.quoteRequestState === AsyncProcessState.Pending) {
            return <AmountPlaceholder isPulsating={true} color={PLACEHOLDER_COLOR} />;
        }
        if (_.isUndefined(this.props.selectedAssetAmount)) {
            return <AmountPlaceholder isPulsating={false} color={PLACEHOLDER_COLOR} />;
        }
        return amountFunction();
    }

    private readonly _renderEthAmount = (): React.ReactNode => {
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

    private readonly _renderDollarAmount = (): React.ReactNode => {
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
