import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { SelectedERC20AssetAmountInput } from '../containers/selected_erc20_asset_amount_input';
import { ColorOption } from '../style/theme';
import { Asset, AsyncProcessState, ERC20Asset, ERC721Asset, OrderProcessState, OrderState } from '../types';
import { format } from '../util/format';

import { AmountPlaceholder } from './amount_placeholder';
import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Icon } from './ui/icon';
import { Image } from './ui/image';
import { Spinner } from './ui/spinner';
import { Text } from './ui/text';

export interface InstantHeadingProps {
    selectedAsset?: Asset;
    selectedAssetUnitAmount?: BigNumber;
    totalEthBaseUnitAmount?: BigNumber;
    ethUsdPrice?: BigNumber;
    quoteRequestState: AsyncProcessState;
    swapOrderState: OrderState;
    onSelectAssetClick?: (asset?: ERC20Asset) => void;
}

const PLACEHOLDER_COLOR = ColorOption.white;
const ICON_WIDTH = 34;
const ICON_HEIGHT = 34;
const ICON_COLOR = ColorOption.white;

export class InstantHeading extends React.PureComponent<InstantHeadingProps, {}> {
    public render(): React.ReactNode {
        return this._renderAssetHeadingContent();
    }

    private _renderAssetHeadingContent(): React.ReactNode {
        const { selectedAsset } = this.props;
        if (selectedAsset === undefined) {
            // TODO: Only the ERC20 flow supports selecting assets.
            return this._renderERC20AssetHeading();
        }
        if (selectedAsset.metaData.assetProxyId === AssetProxyId.ERC20) {
            return this._renderERC20AssetHeading();
        } else if (selectedAsset.metaData.assetProxyId === AssetProxyId.ERC721) {
            return this._renderERC721AssetHeading(selectedAsset as ERC721Asset);
        }
        return null;
    }
    // tslint:disable-next-line:prefer-function-over-method
    private _renderERC721AssetHeading(asset: ERC721Asset): React.ReactNode {
        return (
            <Container width="100%" padding="30px 0px 0px">
                <Flex>
                    <Text
                        textTransform="uppercase"
                        fontColor={ColorOption.primaryColor}
                        fontWeight={700}
                        fontSize="20px"
                    >
                        {asset.metaData.name}
                    </Text>
                </Flex>
                <Flex>
                    <Container
                        marginTop="15px"
                        width="200px"
                        height="200px"
                        position="relative"
                        overflow="hidden"
                        borderRadius="50%"
                    >
                        <Image src={asset.metaData.imageUrl} height="100%" objectFit="cover" />
                    </Container>
                </Flex>
            </Container>
        );
    }

    private _renderERC20AssetHeading(): React.ReactNode {
        const iconOrAmounts = this._renderIcon() || this._renderAmountsSection();
        return (
            <Container backgroundColor={ColorOption.primaryColor} width="100%" padding="20px">
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
        if (
            this.props.totalEthBaseUnitAmount === undefined &&
            this.props.quoteRequestState !== AsyncProcessState.Pending
        ) {
            return null;
        } else {
            return (
                <Container>
                    <Container marginBottom="5px">{this._renderPlaceholderOrAmount(this._renderEthAmount)}</Container>
                    <Container opacity={0.7}>{this._renderPlaceholderOrAmount(this._renderDollarAmount)}</Container>
                </Container>
            );
        }
    }

    private _renderIcon(): React.ReactNode {
        const processState = this.props.swapOrderState.processState;

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
        const processState = this.props.swapOrderState.processState;
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
        if (this.props.selectedAssetUnitAmount === undefined) {
            return <AmountPlaceholder isPulsating={false} color={PLACEHOLDER_COLOR} />;
        }
        return amountFunction();
    }

    private readonly _renderEthAmount = (): React.ReactNode => {
        const ethAmount = format.ethBaseUnitAmount(
            this.props.totalEthBaseUnitAmount,
            4,
            <AmountPlaceholder isPulsating={false} color={PLACEHOLDER_COLOR} />,
        );

        const fontSize = _.isString(ethAmount) && ethAmount.length >= 13 ? '14px' : '16px';
        return (
            <Text
                fontSize={fontSize}
                textAlign="right"
                width="100%"
                fontColor={ColorOption.white}
                fontWeight={500}
                noWrap={true}
            >
                {ethAmount}
            </Text>
        );
    };

    private readonly _renderDollarAmount = (): React.ReactNode => {
        return (
            <Text fontSize="16px" textAlign="right" width="100%" fontColor={ColorOption.white} noWrap={true}>
                {format.ethBaseUnitAmountInUsd(
                    this.props.totalEthBaseUnitAmount,
                    this.props.ethUsdPrice,
                    2,
                    <AmountPlaceholder isPulsating={false} color={ColorOption.white} />,
                )}
            </Text>
        );
    };
}
