import { AssetProxyId } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { assetMetaData } from '../data/asset_meta_data';
import { ColorOption } from '../style/theme';

import { AmountInput, AmountInputProps } from './amount_input';
import { Container, Text } from './ui';

export interface AssetAmountInputProps extends AmountInputProps {
    assetData?: string;
    onChange: (value?: BigNumber, assetData?: string) => void;
}

export class AssetAmountInput extends React.Component<AssetAmountInputProps> {
    public static defaultProps = {
        onChange: _.noop.bind(_),
    };
    public render(): React.ReactNode {
        const { assetData, onChange, ...rest } = this.props;
        return (
            <Container>
                <AmountInput {...rest} onChange={this._handleChange} />
                <Container display="inline-block" marginLeft="10px">
                    <Text fontSize={rest.fontSize} fontColor={ColorOption.white} textTransform="uppercase">
                        {this._getAssetSymbolLabel()}
                    </Text>
                </Container>
            </Container>
        );
    }
    private readonly _getAssetSymbolLabel = (): string => {
        const unknownLabel = '???';
        if (_.isUndefined(this.props.assetData)) {
            return unknownLabel;
        }
        const metaData = assetMetaData[this.props.assetData];
        if (_.isUndefined(metaData)) {
            return unknownLabel;
        }
        if (metaData.assetProxyId === AssetProxyId.ERC20) {
            return metaData.symbol;
        }
        return unknownLabel;
    };
    private readonly _handleChange = (value?: BigNumber): void => {
        this.props.onChange(value, this.props.assetData);
    };
}
