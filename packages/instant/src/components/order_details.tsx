import { BuyQuoteInfo } from '@0x/asset-buyer';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { oc } from 'ts-optchain';

import { BIG_NUMBER_ZERO, DEFAULT_UNKOWN_ASSET_NAME } from '../constants';
import { ColorOption } from '../style/theme';
import { BaseCurrency } from '../types';
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
        const { baseCurrency, buyQuoteInfo } = this.props;

        return (
            <Container width="100%" flexGrow={1} padding="20px 20px 0px 20px">
                <Container marginBottom="10px">{this._renderHeader()}</Container>

                <OrderDetailsRow
                    labelText={this._assetLabelText()}
                    primaryValue={this._displayAmountOrPlaceholder(buyQuoteInfo && buyQuoteInfo.assetEthAmount)}
                />
                <OrderDetailsRow
                    labelText="Fee"
                    primaryValue={this._displayAmountOrPlaceholder(buyQuoteInfo && buyQuoteInfo.feeEthAmount)}
                />
                <OrderDetailsRow
                    labelText="Total Cost"
                    isLabelBold={true}
                    primaryValue={this._displayAmountOrPlaceholder(buyQuoteInfo && buyQuoteInfo.totalEthAmount)}
                    secondaryValue={this._totalCostSecondaryValue()}
                />
            </Container>
        );
    }

    private _totalCostSecondaryValue(): React.ReactNode {
        const secondaryCurrency = this.props.baseCurrency === BaseCurrency.USD ? BaseCurrency.ETH : BaseCurrency.USD;

        const canDisplayCurrency =
            secondaryCurrency === BaseCurrency.ETH ||
            (secondaryCurrency === BaseCurrency.USD &&
                this.props.ethUsdPrice &&
                this.props.ethUsdPrice.greaterThan(BIG_NUMBER_ZERO));

        if (this.props.buyQuoteInfo && canDisplayCurrency) {
            return this._displayAmount(secondaryCurrency, this.props.buyQuoteInfo.totalEthAmount);
        } else {
            return undefined;
        }
    }

    private _displayAmountOrPlaceholder(weiAmount?: BigNumber): React.ReactNode {
        const { baseCurrency, ethUsdPrice, isLoading } = this.props;

        if (_.isUndefined(weiAmount)) {
            return (
                <Container opacity={0.5}>
                    <AmountPlaceholder color={ColorOption.lightGrey} isPulsating={isLoading} />
                </Container>
            );
        }

        return this._displayAmount(baseCurrency, weiAmount);
    }

    private _displayAmount(currency: BaseCurrency, weiAmount: BigNumber): React.ReactNode {
        switch (currency) {
            case BaseCurrency.USD:
                return format.ethBaseUnitAmountInUsd(weiAmount, this.props.ethUsdPrice, 2, '');
            case BaseCurrency.ETH:
                return format.ethBaseUnitAmount(weiAmount, 4, '');
        }
    }

    private _assetLabelText(): string {
        const { assetName, baseCurrency, ethUsdPrice } = this.props;
        const numTokens = this.props.selectedAssetUnitAmount;

        // Display as 0 if we have a selected asset
        const displayNumTokens =
            assetName && assetName !== DEFAULT_UNKOWN_ASSET_NAME && _.isUndefined(numTokens)
                ? new BigNumber(0)
                : numTokens;

        if (!_.isUndefined(displayNumTokens)) {
            let numTokensWithSymbol = displayNumTokens.toString();

            if (assetName) {
                numTokensWithSymbol += ` ${assetName}`;
            }

            const pricePerTokenWei = this._pricePerTokenWei();
            if (pricePerTokenWei) {
                numTokensWithSymbol += ` @ ${this._displayAmount(baseCurrency, pricePerTokenWei)}`;
            }
            return numTokensWithSymbol;
        }

        return 'Token Amount';
    }

    private _pricePerTokenWei(): BigNumber | undefined {
        const buyQuoteAccessor = oc(this.props.buyQuoteInfo);
        const assetTotalInWei = buyQuoteAccessor.assetEthAmount();
        const selectedAssetUnitAmount = this.props.selectedAssetUnitAmount;
        return !_.isUndefined(assetTotalInWei) &&
            !_.isUndefined(selectedAssetUnitAmount) &&
            !selectedAssetUnitAmount.eq(BIG_NUMBER_ZERO)
            ? assetTotalInWei.div(selectedAssetUnitAmount).ceil()
            : undefined;
    }

    private _renderHeader(): React.ReactNode {
        return (
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
        );
    }
}

export interface OrderDetailsRowProps {
    labelText: string;
    isLabelBold?: boolean;
    isPrimaryValueBold?: boolean;
    primaryValue: React.ReactNode;
    secondaryValue?: React.ReactNode;
}
export class OrderDetailsRow extends React.Component<OrderDetailsRowProps, {}> {
    public render(): React.ReactNode {
        return (
            <Container padding="10px 0px" borderTop="1px dashed" borderColor={ColorOption.feintGrey}>
                <Flex justify="space-between">
                    {this._renderLabel()}
                    <Container>{this._renderValues()}</Container>
                </Flex>
            </Container>
        );
    }

    private _renderLabel(): React.ReactNode {
        return (
            <Text fontWeight={this.props.isLabelBold ? 700 : 400} fontColor={ColorOption.grey}>
                {this.props.labelText}
            </Text>
        );
    }

    private _renderValues(): React.ReactNode {
        const secondaryValueNode: React.ReactNode = this.props.secondaryValue && (
            <Container marginRight="3px" display="inline-block">
                <Text fontColor={ColorOption.lightGrey}>({this.props.secondaryValue})</Text>
            </Container>
        );

        return (
            <React.Fragment>
                {secondaryValueNode}
                <Text fontWeight={this.props.isPrimaryValueBold ? 700 : 400}>{this.props.primaryValue}</Text>
            </React.Fragment>
        );
    }
}
