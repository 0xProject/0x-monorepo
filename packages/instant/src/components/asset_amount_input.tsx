import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { ERC20Asset } from '../types';
import { assetUtils } from '../util/asset';
import { util } from '../util/util';

import { ScalingAmountInput } from './scaling_amount_input';
import { Container, Text } from './ui';

// Asset amounts only apply to ERC20 assets
export interface AssetAmountInputProps {
    asset?: ERC20Asset;
    onChange: (value?: BigNumber, asset?: ERC20Asset) => void;
    startingFontSizePx: number;
    fontColor?: ColorOption;
}

export interface AssetAmountInputState {
    currentFontSizePx: number;
}

export class AssetAmountInput extends React.Component<AssetAmountInputProps, AssetAmountInputState> {
    public static defaultProps = {
        onChange: util.boundNoop,
    };
    constructor(props: AssetAmountInputProps) {
        super(props);
        this.state = {
            currentFontSizePx: props.startingFontSizePx,
        };
    }
    public render(): React.ReactNode {
        const { asset, onChange, ...rest } = this.props;
        return (
            <Container>
                <Container borderBottom="1px solid rgba(255,255,255,0.3)" display="inline-block">
                    <ScalingAmountInput
                        {...rest}
                        startWidthCh={3.5}
                        endWidthCh={4}
                        maxFontSizePx={this.props.startingFontSizePx}
                        onChange={this._handleChange}
                        onFontSizeChange={this._handleFontSizeChange}
                    />
                </Container>
                <Container display="inline-block" marginLeft="10px">
                    <Text
                        fontSize={`${this.state.currentFontSizePx}px`}
                        fontColor={ColorOption.white}
                        textTransform="uppercase"
                    >
                        {assetUtils.bestNameForAsset(asset)}
                    </Text>
                </Container>
            </Container>
        );
    }
    private readonly _handleChange = (value?: BigNumber): void => {
        this.props.onChange(value, this.props.asset);
    };
    private readonly _handleFontSizeChange = (fontSizePx: number): void => {
        this.setState({
            currentFontSizePx: fontSizePx,
        });
    };
}
