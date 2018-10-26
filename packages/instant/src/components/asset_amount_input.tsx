import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { ERC20Asset } from '../types';
import { assetUtils } from '../util/asset';
import { util } from '../util/util';

import { AmountInput, AmountInputProps } from './amount_input';
import { Container, Text } from './ui';

// Asset amounts only apply to ERC20 assets
export interface AssetAmountInputProps extends AmountInputProps {
    asset?: ERC20Asset;
    onChange: (value?: BigNumber, asset?: ERC20Asset) => void;
}

export class AssetAmountInput extends React.Component<AssetAmountInputProps> {
    public static defaultProps = {
        onChange: util.boundNoop,
    };
    public render(): React.ReactNode {
        const { asset, onChange, ...rest } = this.props;
        return (
            <Container>
                <AmountInput {...rest} onChange={this._handleChange} />
                <Container display="inline-block" marginLeft="10px">
                    <Text fontSize={rest.fontSize} fontColor={ColorOption.white} textTransform="uppercase">
                        {assetUtils.bestNameForAsset(asset)}
                    </Text>
                </Container>
            </Container>
        );
    }
    private readonly _handleChange = (value?: BigNumber): void => {
        this.props.onChange(value, this.props.asset);
    };
}
