import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { SelectedAssetAmountInput } from '../containers/selected_asset_amount_input';
import { ColorOption } from '../style/theme';
import { AsyncProcessState } from '../types';
import { format } from '../util/format';

import { AmountPlaceholder } from './amount_placeholder';
import { Container, Flex, Text } from './ui';

export interface InstantHeadingProps {
    selectedAssetAmount?: BigNumber;
    totalEthBaseAmount?: BigNumber;
    ethUsdPrice?: BigNumber;
    quoteRequestState: AsyncProcessState;
}

export class InstantHeading extends React.Component<InstantHeadingProps, {}> {
    public render(): React.ReactNode {
        const placeholderAmountToAlwaysShow = this._placeholderAmountToAlwaysShow();
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
                        I want to buy
                    </Text>
                </Container>
                <Flex direction="row" justify="space-between">
                    <SelectedAssetAmountInput fontSize="45px" />
                    <Flex direction="column" justify="space-between">
                        <Container marginBottom="5px">{placeholderAmountToAlwaysShow || this._ethAmount()}</Container>
                        <Container opacity={0.7}>{placeholderAmountToAlwaysShow || this._dollarAmount()}</Container>
                    </Flex>
                </Flex>
            </Container>
        );
    }

    private _placeholderAmountToAlwaysShow(): React.ReactNode | undefined {
        if (this.props.quoteRequestState === AsyncProcessState.PENDING) {
            return <AmountPlaceholder pulsating={true} />;
        }
        if (_.isUndefined(this.props.selectedAssetAmount)) {
            return <AmountPlaceholder pulsating={false} />;
        }
        return undefined;
    }

    private _ethAmount(): React.ReactNode {
        return (
            <Text fontSize="16px" fontColor={ColorOption.white} fontWeight={500}>
                {format.ethBaseAmount(this.props.totalEthBaseAmount, 4, <AmountPlaceholder pulsating={false} />)}
            </Text>
        );
    }

    private _dollarAmount(): React.ReactNode {
        return (
            <Text fontSize="16px" fontColor={ColorOption.white}>
                {format.ethBaseAmountInUsd(
                    this.props.totalEthBaseAmount,
                    this.props.ethUsdPrice,
                    2,
                    <AmountPlaceholder pulsating={false} />,
                )}
            </Text>
        );
    }
}
