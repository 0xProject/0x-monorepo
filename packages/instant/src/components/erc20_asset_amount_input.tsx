import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption, transparentWhite } from '../style/theme';
import { ERC20Asset } from '../types';
import { assetUtils } from '../util/asset';
import { BigNumberInput } from '../util/big_number_input';
import { util } from '../util/util';

import { ScalingAmountInput } from './scaling_amount_input';
import { Container, Text } from './ui';

// Asset amounts only apply to ERC20 assets
export interface ERC20AssetAmountInputProps {
    asset?: ERC20Asset;
    value?: BigNumberInput;
    onChange: (value?: BigNumberInput, asset?: ERC20Asset) => void;
    startingFontSizePx: number;
    fontColor?: ColorOption;
}

export interface ERC20AssetAmountInputState {
    currentFontSizePx: number;
}

export class ERC20AssetAmountInput extends React.Component<ERC20AssetAmountInputProps, ERC20AssetAmountInputState> {
    public static defaultProps = {
        onChange: util.boundNoop,
    };
    constructor(props: ERC20AssetAmountInputProps) {
        super(props);
        this.state = {
            currentFontSizePx: props.startingFontSizePx,
        };
    }
    public render(): React.ReactNode {
        const { asset, onChange, ...rest } = this.props;
        return (
            <Container whiteSpace="nowrap">
                <Container borderBottom={`1px solid ${transparentWhite}`} display="inline-block">
                    <ScalingAmountInput
                        {...rest}
                        textLengthThreshold={this._textLengthThresholdForAsset(asset)}
                        maxFontSizePx={this.props.startingFontSizePx}
                        onChange={this._handleChange}
                        onFontSizeChange={this._handleFontSizeChange}
                    />
                </Container>
                <Container display="inline-flex" marginLeft="10px" title={assetUtils.bestNameForAsset(asset)}>
                    <Text
                        fontSize={`${this.state.currentFontSizePx}px`}
                        fontColor={ColorOption.white}
                        textTransform="uppercase"
                    >
                        {assetUtils.formattedSymbolForAsset(asset)}
                    </Text>
                </Container>
            </Container>
        );
    }
    private readonly _handleChange = (value?: BigNumberInput): void => {
        this.props.onChange(value, this.props.asset);
    };
    private readonly _handleFontSizeChange = (fontSizePx: number): void => {
        this.setState({
            currentFontSizePx: fontSizePx,
        });
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
