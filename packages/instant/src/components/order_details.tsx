import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { oc } from 'ts-optchain';

import { BIG_NUMBER_ZERO, DEFAULT_UNKOWN_ASSET_NAME } from '../constants';
import { ColorOption } from '../style/theme';
import { BaseCurrency, ZeroExAPIQuoteResponse } from '../types';
import { format } from '../util/format';

import { AmountPlaceholder } from './amount_placeholder';
import { SectionHeader } from './section_header';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Text, TextProps } from './ui/text';

export interface OrderDetailsProps {
    quote?: ZeroExAPIQuoteResponse;
    selectedAssetUnitAmount?: BigNumber;
    ethUsdPrice?: BigNumber;
    isLoading: boolean;
    assetName?: string;
    baseCurrency: BaseCurrency;
    onBaseCurrencySwitchEth: () => void;
    onBaseCurrencySwitchUsd: () => void;
}
export class OrderDetails extends React.PureComponent<OrderDetailsProps> {
    public render(): React.ReactNode {
        const shouldShowUsdError = this.props.baseCurrency === BaseCurrency.USD && this._hadErrorFetchingUsdPrice();
        return (
            <Container width="100%" flexGrow={1} padding="20px 20px 0px 20px">
                <Container marginBottom="10px">{this._renderHeader()}</Container>
                {shouldShowUsdError ? this._renderErrorFetchingUsdPrice() : this._renderRows()}
            </Container>
        );
    }

    private _renderRows(): React.ReactNode {
        const { quote } = this.props;
        return (
            <React.Fragment>
                <OrderDetailsRow
                    labelText={this._assetAmountLabel()}
                    primaryValue={this._displayAmountOrPlaceholder(quote && quote.sellAmount)}
                />
                <OrderDetailsRow
                    labelText="Fee"
                    primaryValue={this._displayAmountOrPlaceholder(
                        quote && quote.protocolFee,
                    )}
                />
                <OrderDetailsRow
                    labelText="Total Cost"
                    isLabelBold={true}
                    primaryValue={this._displayAmountOrPlaceholder(
                        quote && quote.value,
                    )}
                    isPrimaryValueBold={true}
                    secondaryValue={this._totalCostSecondaryValue()}
                />
            </React.Fragment>
        );
    }

    private _renderErrorFetchingUsdPrice(): React.ReactNode {
        return (
            <Text>
                There was an error fetching the USD price.
                <Text
                    onClick={this.props.onBaseCurrencySwitchEth}
                    fontWeight={700}
                    fontColor={ColorOption.primaryColor}
                >
                    Click here
                </Text>
                {' to view ETH prices'}
            </Text>
        );
    }

    private _hadErrorFetchingUsdPrice(): boolean {
        return this.props.ethUsdPrice ? this.props.ethUsdPrice.isEqualTo(BIG_NUMBER_ZERO) : false;
    }

    private _totalCostSecondaryValue(): React.ReactNode {
        const secondaryCurrency = this.props.baseCurrency === BaseCurrency.USD ? BaseCurrency.ETH : BaseCurrency.USD;

        const canDisplayCurrency =
            secondaryCurrency === BaseCurrency.ETH ||
            (secondaryCurrency === BaseCurrency.USD && this.props.ethUsdPrice && !this._hadErrorFetchingUsdPrice());

        if (this.props.quote && canDisplayCurrency) {
            return this._displayAmount(
                secondaryCurrency,
                this.props.quote.value,
            );
        } else {
            return undefined;
        }
    }

    private _displayAmountOrPlaceholder(weiAmount?: BigNumber): React.ReactNode {
        const { baseCurrency, isLoading } = this.props;

        if (weiAmount === undefined) {
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

    private _assetAmountLabel(): React.ReactNode {
        const { assetName, baseCurrency } = this.props;
        const numTokens = this.props.selectedAssetUnitAmount;

        // Display as 0 if we have a selected asset
        const displayNumTokens =
            assetName && assetName !== DEFAULT_UNKOWN_ASSET_NAME && numTokens === undefined
                ? new BigNumber(0)
                : numTokens;
        if (displayNumTokens !== undefined) {
            let numTokensWithSymbol: React.ReactNode = displayNumTokens.toString();
            if (assetName) {
                numTokensWithSymbol += ` ${assetName}`;
            }
            const pricePerTokenWei = this._pricePerTokenWei();
            if (pricePerTokenWei) {
                const atPriceDisplay = (
                    <Text fontColor={ColorOption.lightGrey}>
                        @ {this._displayAmount(baseCurrency, pricePerTokenWei)}
                    </Text>
                );
                numTokensWithSymbol = (
                    <React.Fragment>
                        {numTokensWithSymbol} {atPriceDisplay}
                    </React.Fragment>
                );
            }
            return numTokensWithSymbol;
        }
        return 'Token Amount';
    }

    private _pricePerTokenWei(): BigNumber | undefined {
        const swapQuoteAccessor = oc(this.props.quote);
        const assetTotalInWei = swapQuoteAccessor.sellAmount();
        const selectedAssetUnitAmount = this.props.selectedAssetUnitAmount;
        return assetTotalInWei !== undefined &&
            selectedAssetUnitAmount !== undefined &&
            !selectedAssetUnitAmount.eq(BIG_NUMBER_ZERO)
            ? assetTotalInWei.div(selectedAssetUnitAmount).integerValue(BigNumber.ROUND_CEIL)
            : undefined;
    }

    private _baseCurrencyChoice(choice: BaseCurrency): React.ReactNode {
        const onClick =
            choice === BaseCurrency.ETH ? this.props.onBaseCurrencySwitchEth : this.props.onBaseCurrencySwitchUsd;
        const isSelected = this.props.baseCurrency === choice;

        const textStyle: TextProps = { onClick, fontSize: '12px' };
        if (isSelected) {
            textStyle.fontColor = ColorOption.primaryColor;
            textStyle.fontWeight = 700;
        } else {
            textStyle.fontColor = ColorOption.lightGrey;
        }
        return <Text {...textStyle}>{choice}</Text>;
    }

    private _renderHeader(): React.ReactNode {
        return (
            <Flex justify="space-between">
                <SectionHeader>Order Details</SectionHeader>
                <Container>
                    {this._baseCurrencyChoice(BaseCurrency.ETH)}
                    <Container marginLeft="5px" marginRight="5px" display="inline">
                        <Text fontSize="12px" fontColor={ColorOption.feintGrey}>
                            /
                        </Text>
                    </Container>
                    {this._baseCurrencyChoice(BaseCurrency.USD)}
                </Container>
            </Flex>
        );
    }
}

export interface OrderDetailsRowProps {
    labelText: React.ReactNode;
    isLabelBold?: boolean;
    isPrimaryValueBold?: boolean;
    primaryValue: React.ReactNode;
    secondaryValue?: React.ReactNode;
}
export class OrderDetailsRow extends React.PureComponent<OrderDetailsRowProps, {}> {
    public render(): React.ReactNode {
        return (
            <Container padding="10px 0px" borderTop="1px dashed" borderColor={ColorOption.feintGrey}>
                <Flex justify="space-between">
                    <Text fontWeight={this.props.isLabelBold ? 700 : 400} fontColor={ColorOption.grey}>
                        {this.props.labelText}
                    </Text>
                    <Container>{this._renderValues()}</Container>
                </Flex>
            </Container>
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
