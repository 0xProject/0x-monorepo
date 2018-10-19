import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { assetDataUtil } from '../util/asset_data';

import { ColorOption } from '../style/theme';
import { util } from '../util/util';

import { AmountInput, AmountInputProps } from './amount_input';
import { Container, Text } from './ui';

export interface AssetAmountInputProps extends AmountInputProps {
    assetData?: string;
    onChange: (value?: BigNumber, assetData?: string) => void;
}

export class AssetAmountInput extends React.Component<AssetAmountInputProps> {
    public static defaultProps = {
        onChange: util.boundNoop,
    };
    public render(): React.ReactNode {
        const { assetData, onChange, ...rest } = this.props;
        return (
            <Container>
                <AmountInput {...rest} onChange={this._handleChange} />
                <Container display="inline-block" marginLeft="10px">
                    <Text fontSize={rest.fontSize} fontColor={ColorOption.white} textTransform="uppercase">
                        {assetDataUtil.bestNameForAsset(this.props.assetData, '???')}
                    </Text>
                </Container>
            </Container>
        );
    }
    private readonly _handleChange = (value?: BigNumber): void => {
        this.props.onChange(value, this.props.assetData);
    };
}
