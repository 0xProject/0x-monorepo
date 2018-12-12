import { BuyQuoteInfo } from '@0x/asset-buyer';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { DEFAULT_UNKOWN_ASSET_NAME } from '../constants';
import { ColorOption } from '../style/theme';
import { BaseCurrency } from '../types';
import { buyQuoteUtil } from '../util/buy_quote';
import { format } from '../util/format';

import { AmountPlaceholder } from './amount_placeholder';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Text, TextProps } from './ui/text';

interface BaseCurryChoiceProps {
    currencyName: string;
    onClick: () => void;
    isSelected: boolean;
}
const BaseCurrencyChoice: React.StatelessComponent<BaseCurryChoiceProps> = props => {
    const textStyle: TextProps = { onClick: props.onClick, fontSize: '12px' };
    if (props.isSelected) {
        textStyle.fontColor = ColorOption.primaryColor;
        textStyle.fontWeight = 700;
    }
    return <Text {...textStyle}>{props.currencyName}</Text>;
};

const grandTotalDisplayValue = (
    displayPrimaryTotalCost?: React.ReactNode,
    displaySecondaryTotalCost?: React.ReactNode,
): React.ReactNode => {
    if (!displayPrimaryTotalCost) {
        return undefined;
    }
    const secondaryText = displaySecondaryTotalCost && (
        <Container marginRight="3px" display="inline-block">
            <Text fontColor={ColorOption.lightGrey}>({displaySecondaryTotalCost})</Text>
        </Container>
    );
    return (
        <React.Fragment>
            {secondaryText}
            <Text fontWeight={700} fontColor={ColorOption.grey}>
                {displayPrimaryTotalCost}
            </Text>
        </React.Fragment>
    );
};

const tokenAmountLabel = (displayPricePerToken?: React.ReactNode, assetName?: string, numTokens?: BigNumber) => {
    // Display as 0 if we have a selected asset
    const displayNumTokens =
        assetName && assetName !== DEFAULT_UNKOWN_ASSET_NAME && _.isUndefined(numTokens) ? new BigNumber(0) : numTokens;

    if (!_.isUndefined(displayNumTokens)) {
        let numTokensWithSymbol = displayNumTokens.toString();

        if (assetName) {
            numTokensWithSymbol += ` ${assetName}`;
        }

        if (displayPricePerToken) {
            numTokensWithSymbol += ` @ ${displayPricePerToken}`;
        }
        return numTokensWithSymbol;
    }

    return 'Token Amount';
};

const getDisplayAmount = (
    baseCurrency: BaseCurrency,
    weiAmount?: BigNumber,
    ethUsdPrice?: BigNumber,
): React.ReactNode => {
    switch (baseCurrency) {
        case BaseCurrency.USD:
            return format.ethBaseUnitAmountInUsd(weiAmount, ethUsdPrice, 2, '');
        case BaseCurrency.ETH:
            return format.ethBaseUnitAmount(weiAmount, 4, '');
    }
};

export interface OrderDetailsProps {
    buyQuoteInfo?: BuyQuoteInfo;
    selectedAssetUnitAmount?: BigNumber;
    ethUsdPrice?: BigNumber;
    isLoading: boolean;
    assetName?: string;
    baseCurrency: BaseCurrency;
    onBaseCurrencySwitchEth: () => void;
    onBaseCurrencySwitchUsd: () => void;
}
export class OrderDetails extends React.Component<OrderDetailsProps> {
    public render(): React.ReactNode {
        const { baseCurrency, buyQuoteInfo, ethUsdPrice, selectedAssetUnitAmount } = this.props;

        const weiAmounts = buyQuoteUtil.getWeiAmounts(selectedAssetUnitAmount, buyQuoteInfo);
        const secondaryCurrency = baseCurrency === BaseCurrency.USD ? BaseCurrency.ETH : BaseCurrency.USD;
        const grandTotalValue = grandTotalDisplayValue(
            getDisplayAmount(baseCurrency, weiAmounts.grandTotalInWei, ethUsdPrice),
            getDisplayAmount(secondaryCurrency, weiAmounts.grandTotalInWei, ethUsdPrice),
        );

        return (
            <Container width="100%" flexGrow={1} padding="20px 20px 0px 20px">
                <Container marginBottom="10px">
                    <Flex justify="space-between">
                        <Text
                            letterSpacing="1px"
                            fontColor={ColorOption.primaryColor}
                            fontWeight={600}
                            textTransform="uppercase"
                            fontSize="14px"
                        >
                            Order Details
                        </Text>

                        <Container>
                            <BaseCurrencyChoice
                                onClick={this.props.onBaseCurrencySwitchEth}
                                currencyName="ETH"
                                isSelected={this.props.baseCurrency === BaseCurrency.ETH}
                            />
                            <Container marginLeft="3px" marginRight="3px" display="inline">
                                <Text fontSize="12px">/</Text>
                            </Container>
                            <BaseCurrencyChoice
                                onClick={this.props.onBaseCurrencySwitchUsd}
                                currencyName="USD"
                                isSelected={this.props.baseCurrency === BaseCurrency.USD}
                            />
                        </Container>
                    </Flex>
                </Container>
                <OrderDetailsRow
                    isLoading={this.props.isLoading}
                    labelText={tokenAmountLabel(
                        getDisplayAmount(baseCurrency, weiAmounts.pricePerTokenInWei, ethUsdPrice),
                        this.props.assetName,
                        this.props.selectedAssetUnitAmount,
                    )}
                    value={getDisplayAmount(baseCurrency, weiAmounts.assetTotalInWei, ethUsdPrice)}
                />
                <OrderDetailsRow
                    isLoading={this.props.isLoading}
                    labelText="Fee"
                    value={getDisplayAmount(baseCurrency, weiAmounts.feeTotalInWei, ethUsdPrice)}
                />
                <OrderDetailsRow
                    isLoading={this.props.isLoading}
                    isLabelBold={true}
                    labelText={'Total Cost'}
                    value={grandTotalValue}
                />
            </Container>
        );
    }
}

export interface OrderDetailsRowProps {
    labelText: string;
    isLabelBold?: boolean;
    isLoading: boolean;
    value?: React.ReactNode;
}
export class OrderDetailsRow extends React.Component<OrderDetailsRowProps, {}> {
    public render(): React.ReactNode {
        const { labelText, value, isLabelBold, isLoading } = this.props;
        return (
            <Container padding="10px 0px" borderTop="1px dashed" borderColor={ColorOption.feintGrey}>
                <Flex justify="space-between">
                    <Text fontWeight={isLabelBold ? 700 : 400} fontColor={ColorOption.grey}>
                        {labelText}
                    </Text>
                    <Container>
                        {value || (
                            <Container opacity={0.5}>
                                <AmountPlaceholder color={ColorOption.lightGrey} isPulsating={isLoading} />
                            </Container>
                        )}
                    </Container>
                </Flex>
            </Container>
        );
    }
}
