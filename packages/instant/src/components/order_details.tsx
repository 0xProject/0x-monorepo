import { BuyQuoteInfo } from '@0x/asset-buyer';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { DEFAULT_UNKOWN_ASSET_NAME } from '../constants';
import { ColorOption } from '../style/theme';
import { BaseCurrency } from '../types';
import { buyQuoteUtil } from '../util/buy_quote';

import { AmountPlaceholder } from './amount_placeholder';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Text, TextProps } from './ui/text';

interface BaseCurrenySwitchProps {
    currencyName: string;
    onClick: () => void;
    isSelected: boolean;
}
const BaseCurrencySelector: React.StatelessComponent<BaseCurrenySwitchProps> = props => {
    const textStyle: TextProps = { onClick: props.onClick, fontSize: '12px' };
    if (props.isSelected) {
        textStyle.fontColor = ColorOption.primaryColor;
        textStyle.fontWeight = 700;
    }
    return <Text {...textStyle}>{props.currencyName}</Text>;
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
        const { buyQuoteInfo, ethUsdPrice, selectedAssetUnitAmount } = this.props;
        const weiAmounts = buyQuoteUtil.getWeiAmounts(selectedAssetUnitAmount, buyQuoteInfo);

        const displayAmounts =
            this.props.baseCurrency === BaseCurrency.USD
                ? buyQuoteUtil.displayAmountsUsd(weiAmounts, ethUsdPrice)
                : buyQuoteUtil.displayAmountsEth(weiAmounts, ethUsdPrice);

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
                            <BaseCurrencySelector
                                onClick={this.props.onBaseCurrencySwitchEth}
                                currencyName="ETH"
                                isSelected={this.props.baseCurrency === BaseCurrency.ETH}
                            />
                            <Container marginLeft="3px" marginRight="3px" display="inline">
                                <Text fontSize="12px">/</Text>
                            </Container>
                            <BaseCurrencySelector
                                onClick={this.props.onBaseCurrencySwitchUsd}
                                currencyName="USD"
                                isSelected={this.props.baseCurrency === BaseCurrency.USD}
                            />
                        </Container>
                    </Flex>
                </Container>
                <TokenAmountRow
                    numTokens={selectedAssetUnitAmount}
                    assetName={this.props.assetName}
                    displayPricePerToken={displayAmounts.pricePerToken}
                    displayTotalPrice={displayAmounts.assetTotal}
                    isLoading={this.props.isLoading}
                />
                <OrderDetailsRow labelText="Fee" value={displayAmounts.feeTotal} isLoading={this.props.isLoading} />
                <TotalCostRow
                    displaySecondaryTotalCost={displayAmounts.secondaryGrandTotal}
                    displayPrimaryTotalCost={displayAmounts.primaryGrandTotal}
                    isLoading={this.props.isLoading}
                />
            </Container>
        );
    }
}

export interface EthAmountRowProps {
    rowLabel: string;
    ethAmount?: BigNumber;
    isEthAmountInBaseUnits?: boolean;
    ethUsdPrice?: BigNumber;
    shouldEmphasize?: boolean;
    isLoading: boolean;
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
export interface TotalCostRowProps {
    displayPrimaryTotalCost?: React.ReactNode;
    displaySecondaryTotalCost?: React.ReactNode;
    isLoading: boolean;
}
export class TotalCostRow extends React.Component<TotalCostRowProps, {}> {
    public render(): React.ReactNode {
        let value: React.ReactNode;
        if (this.props.displayPrimaryTotalCost) {
            const secondaryText = this.props.displaySecondaryTotalCost && (
                <Container marginRight="3px" display="inline-block">
                    <Text fontColor={ColorOption.lightGrey}>({this.props.displaySecondaryTotalCost})</Text>
                </Container>
            );
            value = (
                <React.Fragment>
                    {secondaryText}
                    <Text fontWeight={700} fontColor={ColorOption.grey}>
                        {this.props.displayPrimaryTotalCost}
                    </Text>
                </React.Fragment>
            );
        }

        return (
            <OrderDetailsRow isLoading={this.props.isLoading} isLabelBold={true} labelText="Total Cost" value={value} />
        );
    }
}

export interface TokenAmountRowProps {
    assetName?: string;
    displayPricePerToken?: React.ReactNode;
    displayTotalPrice?: React.ReactNode;
    isLoading: boolean;
    numTokens?: BigNumber;
}
export class TokenAmountRow extends React.Component<TokenAmountRowProps> {
    public static DEFAULT_TEXT: string = 'Token Amount';
    public render(): React.ReactNode {
        return (
            <OrderDetailsRow
                isLoading={this.props.isLoading}
                labelText={this._labelText()}
                value={this.props.displayTotalPrice}
            />
        );
    }
    private _labelText(): string {
        const { displayPricePerToken, assetName } = this.props;

        // Display as 0 if we have a selected asset
        const numTokens =
            assetName && assetName !== DEFAULT_UNKOWN_ASSET_NAME && _.isUndefined(this.props.numTokens)
                ? 0
                : this.props.numTokens;

        if (!_.isUndefined(numTokens)) {
            let numTokensWithSymbol = numTokens.toString();

            if (assetName) {
                numTokensWithSymbol += ` ${assetName}`;
            }

            if (displayPricePerToken) {
                numTokensWithSymbol += ` @ ${displayPricePerToken}`;
            }
            return numTokensWithSymbol;
        }

        return TokenAmountRow.DEFAULT_TEXT;
    }
}
