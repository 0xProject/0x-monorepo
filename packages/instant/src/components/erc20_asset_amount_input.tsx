import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption, transparentWhite } from '../style/theme';
import { ERC20Asset } from '../types';
import { assetUtils } from '../util/asset';
import { BigNumberInput } from '../util/big_number_input';
import { util } from '../util/util';

import { ScalingAmountInput } from './scaling_amount_input';
import { Container, Flex, Icon, Text } from './ui';

// Asset amounts only apply to ERC20 assets
export interface ERC20AssetAmountInputProps {
    asset?: ERC20Asset;
    value?: BigNumberInput;
    onChange: (value?: BigNumberInput, asset?: ERC20Asset) => void;
    onSelectAssetClick?: (asset?: ERC20Asset) => void;
    startingFontSizePx: number;
    fontColor?: ColorOption;
    isDisabled: boolean;
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
                {_.isUndefined(asset) ? this._renderBackupContent() : this._renderContentForAsset(asset)}
            </Container>
        );
    }
    private readonly _renderContentForAsset = (asset: ERC20Asset): React.ReactNode => {
        const { onChange, ...rest } = this.props;
        const amountBorderBottom = this.props.isDisabled ? '' : `1px solid ${transparentWhite}`;
        return (
            <React.Fragment>
                <Container borderBottom={amountBorderBottom} display="inline-block">
                    <ScalingAmountInput
                        {...rest}
                        textLengthThreshold={this._textLengthThresholdForAsset(asset)}
                        maxFontSizePx={this.props.startingFontSizePx}
                        onChange={this._handleChange}
                        onFontSizeChange={this._handleFontSizeChange}
                    />
                </Container>
                <Container
                    cursor="pointer"
                    display="inline-block"
                    marginLeft="8px"
                    title={assetUtils.bestNameForAsset(asset, undefined)}
                >
                    <Flex inline={true}>
                        <Text
                            fontSize={`${this.state.currentFontSizePx}px`}
                            fontColor={ColorOption.white}
                            textTransform="uppercase"
                            onClick={this._handleSymbolClick}
                        >
                            {assetUtils.formattedSymbolForAsset(asset)}
                        </Text>
                        {this._renderChevronIcon()}
                    </Flex>
                </Container>
            </React.Fragment>
        );
    };
    private readonly _renderBackupContent = (): React.ReactNode => {
        return (
            <Flex>
                <Text
                    fontSize="30px"
                    fontColor={ColorOption.white}
                    opacity={0.7}
                    fontWeight="500"
                    onClick={this._handleSymbolClick}
                >
                    Select Token
                </Text>
                {this._renderChevronIcon()}
            </Flex>
        );
    };
    private readonly _renderChevronIcon = (): React.ReactNode => {
        return (
            <Container marginLeft="5px" onClick={this._handleSymbolClick}>
                <Icon icon="chevron" width={12} />
            </Container>
        );
    };
    private readonly _handleChange = (value?: BigNumberInput): void => {
        this.props.onChange(value, this.props.asset);
    };
    private readonly _handleFontSizeChange = (fontSizePx: number): void => {
        this.setState({
            currentFontSizePx: fontSizePx,
        });
    };
    private readonly _handleSymbolClick = () => {
        if (this.props.onSelectAssetClick) {
            this.props.onSelectAssetClick(this.props.asset);
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
