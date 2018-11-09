import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption, transparentWhite } from '../style/theme';
import { ERC20Asset, SimpleHandler } from '../types';
import { assetUtils } from '../util/asset';
import { util } from '../util/util';

import { ScalingAmountInput } from './scaling_amount_input';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Icon } from './ui/icon';
import { Text } from './ui/text';

// Asset amounts only apply to ERC20 assets
export interface ERC20AssetAmountInputProps {
    asset?: ERC20Asset;
    value?: BigNumber;
    onChange: (value?: BigNumber, asset?: ERC20Asset) => void;
    onSelectAssetClick?: (asset?: ERC20Asset) => void;
    startingFontSizePx: number;
    fontColor?: ColorOption;
    isDisabled: boolean;
    numberOfAssetsAvailable?: number;
}

export interface ERC20AssetAmountInputState {
    currentFontSizePx: number;
}

export class ERC20AssetAmountInput extends React.Component<ERC20AssetAmountInputProps, ERC20AssetAmountInputState> {
    public static defaultProps = {
        onChange: util.boundNoop,
        isDisabled: false,
    };
    constructor(props: ERC20AssetAmountInputProps) {
        super(props);
        this.state = {
            currentFontSizePx: props.startingFontSizePx,
        };
    }
    public render(): React.ReactNode {
        const { asset } = this.props;
        return (
            <Container whiteSpace="nowrap">
                {_.isUndefined(asset) ? this._renderTokenSelectionContent() : this._renderContentForAsset(asset)}
            </Container>
        );
    }
    private readonly _renderContentForAsset = (asset: ERC20Asset): React.ReactNode => {
        const { onChange, ...rest } = this.props;
        const amountBorderBottom = this.props.isDisabled ? '' : `1px solid ${transparentWhite}`;
        const onSymbolClick = this._generateSelectAssetClickHandler();
        return (
            <React.Fragment>
                <Container borderBottom={amountBorderBottom} display="inline-block">
                    <ScalingAmountInput
                        {...rest}
                        textLengthThreshold={this._textLengthThresholdForAsset(asset)}
                        maxFontSizePx={this.props.startingFontSizePx}
                        onAmountChange={this._handleChange}
                        onFontSizeChange={this._handleFontSizeChange}
                    />
                </Container>
                <Container
                    display="inline-block"
                    marginLeft="8px"
                    title={assetUtils.bestNameForAsset(asset, undefined)}
                >
                    <Flex inline={true}>
                        <Text
                            fontSize={`${this.state.currentFontSizePx}px`}
                            fontColor={ColorOption.white}
                            textTransform="uppercase"
                            onClick={onSymbolClick}
                        >
                            {assetUtils.formattedSymbolForAsset(asset)}
                        </Text>
                        {this._renderChevronIcon()}
                    </Flex>
                </Container>
            </React.Fragment>
        );
    };
    private readonly _renderTokenSelectionContent = (): React.ReactNode => {
        const { numberOfAssetsAvailable } = this.props;
        let text = 'Select Token';
        if (_.isUndefined(numberOfAssetsAvailable)) {
            text = 'Loading...';
        } else if (numberOfAssetsAvailable === 0) {
            text = 'Assets Unavailable';
        }
        return (
            <Flex>
                <Text
                    fontSize="30px"
                    fontColor={ColorOption.white}
                    opacity={0.7}
                    fontWeight="500"
                    onClick={this._generateSelectAssetClickHandler()}
                >
                    {text}
                </Text>
                {this._renderChevronIcon()}
            </Flex>
        );
    };
    private readonly _renderChevronIcon = (): React.ReactNode => {
        if (!this._areMultipleAssetsAvailable()) {
            return null;
        }
        return (
            <Container marginLeft="5px">
                <Icon icon="chevron" width={12} stroke={ColorOption.white} onClick={this._handleSelectAssetClick} />
            </Container>
        );
    };
    private readonly _handleChange = (value?: BigNumber): void => {
        this.props.onChange(value, this.props.asset);
    };
    private readonly _handleFontSizeChange = (fontSizePx: number): void => {
        this.setState({
            currentFontSizePx: fontSizePx,
        });
    };
    private readonly _generateSelectAssetClickHandler = (): SimpleHandler | undefined => {
        // We don't want to allow opening the token selection panel if there are no assets.
        // Since styles are inferred from the presence of a click handler, we want to return undefined
        // instead of providing a noop.
        if (!this._areMultipleAssetsAvailable() || _.isUndefined(this.props.onSelectAssetClick)) {
            return undefined;
        }
        return this._handleSelectAssetClick;
    };
    private readonly _areMultipleAssetsAvailable = (): boolean => {
        const { numberOfAssetsAvailable } = this.props;
        return !_.isUndefined(numberOfAssetsAvailable) && numberOfAssetsAvailable > 1;
    };
    private readonly _handleSelectAssetClick = (): void => {
        if (this.props.onSelectAssetClick) {
            this.props.onSelectAssetClick();
        }
    };
    // For assets with symbols of different length,
    // start scaling the input at different character lengths
    private readonly _textLengthThresholdForAsset = (asset?: ERC20Asset): number => {
        if (_.isUndefined(asset)) {
            return 3;
        }
        const symbol = asset.metaData.symbol;
        if (symbol.length <= 3) {
            return 5;
        }
        if (symbol.length === 5) {
            return 3;
        }
        return 4;
    };
}
