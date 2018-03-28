import { SignedOrder, ZeroEx } from '0x.js';
import { InjectedWeb3Subprovider, RedundantRPCSubprovider } from '@0xproject/subproviders';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeaderTitle,
    Column,
    Columns,
    Container,
    Content,
    Control,
    Field,
    Icon,
    Image,
    Input,
    Label,
    Select,
    TextArea,
} from 'bloomer';
import 'bulma/css/bulma.css';
import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Web3 from 'web3';
import * as Web3ProviderEngine from 'web3-provider-engine';

import { convertSignedOrderV1ToSignedOrderV2, ForwarderWrapper } from '../../../contract_wrappers/forwarder_wrapper';
import { artifacts } from '../../artifacts';

import { Dispatcher } from '../../redux/dispatcher';
import {
    AccountTokenBalances,
    AccountWeiBalances,
    AssetToken,
    Quote,
    QuoteRequest,
    TokenBalances,
    TokenPair,
} from '../../types';
import AccountBlockie from '../AccountBlockie';
import TokenSelector from '../TokenSelector';

/* tslint:disable:prefer-function-over-method member-access */

interface TradeRange {
    filled: BigNumber;
    tokens: BigNumber;
}
interface BuyWidgetProps {
    onTokenChange?: (token: string) => any;
    onAmountChange?: (amount: BigNumber) => any;
    address: string;
    networkId: number;
    weiBalances: AccountWeiBalances;
    tokenBalances: AccountTokenBalances;
    selectedToken: AssetToken;
    web3Wrapper: Web3Wrapper;
    zeroEx: ZeroEx;
    dispatcher: Dispatcher;
    quote: Quote;
}

interface BuyWidgetState {
    amount?: BigNumber;
}

const ETH_DECIMAL_PLACES = 18;
class BuyWidget extends React.Component<BuyWidgetProps, BuyWidgetState> {
    constructor(props: any) {
        super(props);
        this.state = {
            amount: ZeroEx.toBaseUnitAmount(new BigNumber(1), ETH_DECIMAL_PLACES),
        };

        this._handleAmountChange = this._handleAmountChange.bind(this);
        this._handleSubmitAsync = this._handleSubmitAsync.bind(this);
    }

    public async componentDidUpdate() {
        await this._quoteSelectedTokenAsync();
    }

    render() {
        const { address, weiBalances, tokenBalances, selectedToken, quote } = this.props;
        const tokenBalance = tokenBalances[address] ? tokenBalances[address][selectedToken] : new BigNumber(0);
        const weiBalance = weiBalances[address] || new BigNumber(0);

        // tslint:disable-next-line:prefer-const
        let estimatedCost = <Field />;
        if (this._hasQuoteForSelectedToken()) {
            // tslint:disable-next-line:no-console
            const tradeEstimate = this._computeTradeRanges(
                quote.orders,
                BigNumber.min(this.state.amount, quote.maxAmount),
            );
            const [rangeLow, rangeHigh] = tradeEstimate;

            const order = quote.orders[0];
            const makerTokenAmount: BigNumber = order.makerTokenAmount;
            const weiAmount = order.takerTokenAmount;
            const ratio = order.makerTokenAmount.dividedBy(order.takerTokenAmount);
            const amountInWei = this.state.amount;
            const tokenAmount = ZeroEx.toUnitAmount(ratio.times(amountInWei), 18);

            const colorStyle = { color: 'rgb(189, 189, 189)' };
            estimatedCost = (
                <Field>
                    <Control hasIcons={'right'}>
                        <Label style={{ ...colorStyle, marginTop: 30 }} isSize="small">
                            ESTIMATE
                            <Icon
                                className="fa fa-xs fa-info-circle"
                                style={{
                                    marginTop: 3,
                                    marginLeft: 4,
                                    height: '0.7rem',
                                    width: '0.7rem',
                                }}
                            />
                            <Label style={{ ...colorStyle }} isSize="small">
                                {ZeroEx.toUnitAmount(rangeLow.tokens.floor(), 18)
                                    .toFixed(2)
                                    .toString()}...{ZeroEx.toUnitAmount(rangeHigh.tokens.floor(), 18)
                                    .toFixed(2)
                                    .toString()}
                            </Label>
                        </Label>
                    </Control>
                </Field>
            );
        }
        return (
            <Content>
                <AccountBlockie
                    account={address}
                    weiBalance={weiBalance}
                    tokenBalance={tokenBalance}
                    selectedToken={selectedToken}
                />
                <Label isSize="small">SELECT TOKEN</Label>
                <Field isFullWidth={true}>
                    <TokenSelector
                        selectedToken={this.props.selectedToken}
                        onChange={this._handleTokenSelected.bind(this)}
                    />
                </Field>
                <Label style={{ marginTop: 30 }} isSize="small">
                    BUY AMOUNT
                </Label>
                <Field hasAddons={true}>
                    <Control isExpanded={true}>
                        <Input type="text" placeholder="1" onChange={this._handleAmountChange.bind(this)} />
                    </Control>
                    <Control>
                        <Select>
                            <option>ETH</option>
                            <option>ZRX</option>
                        </Select>
                    </Control>
                </Field>
                {estimatedCost}
                <Field style={{ marginTop: 20 }}>
                    <Button
                        isLoading={!this._hasQuoteForSelectedToken()}
                        isFullWidth={true}
                        isColor="info"
                        onClick={this._handleSubmitAsync}
                    >
                        BUY TOKENS
                    </Button>
                </Field>
                <Field style={{ marginTop: 20 }} isGrouped={'centered'}>
                    <img style={{ marginLeft: '0px', height: '20px' }} src="/images/powered.png" />
                </Field>
            </Content>
        );
    }

    private async _handleSubmitAsync(event: any) {
        event.preventDefault();
        this.setState((prev, props) => {
            return { ...prev, isLoading: true };
        });
        const { address, quote } = this.props;
        const { amount } = this.state;
        const txHash = await this._fillOrderAsync(address, amount, quote.orders[0]);
        this.setState((prev, props) => {
            return { ...prev, isLoading: false };
        });
    }

    private _handleAmountChange(event: any) {
        event.preventDefault();
        const rawValue = event.target.value;
        let value: undefined | BigNumber;
        if (!_.isUndefined(rawValue) && !_.isEmpty(rawValue)) {
            const ethValue = new BigNumber(rawValue);
            const fillAmount = ZeroEx.toBaseUnitAmount(ethValue, ETH_DECIMAL_PLACES);
            value = fillAmount;
            this.setState((prev, props) => {
                return { ...prev, amount: value };
            });
            this._quoteSelectedTokenAsync().catch(console.log);
        }
    }

    private _handleTokenSelected(token: AssetToken) {
        this.props.dispatcher.updateSelectedToken(token);
    }

    private async _fillOrderAsync(
        takerAddress: string,
        fillAmount: BigNumber,
        signedOrder: SignedOrder,
    ): Promise<string> {
        const forwarder = await this._getForwarderAsync();
        const txHash = await forwarder.fillOrderAsync(
            convertSignedOrderV1ToSignedOrderV2(signedOrder),
            fillAmount,
            takerAddress,
        );
        this.props.dispatcher.transactionSubmitted(txHash);
        const receipt = await this.props.zeroEx.awaitTransactionMinedAsync(txHash);
        this.props.dispatcher.transactionMined(receipt);
        return txHash;
    }

    private async _getForwarderAsync(): Promise<ForwarderWrapper> {
        const forwarderContract = await ForwarderWrapper.getForwarderContractAsync(
            this.props.web3Wrapper,
            this.props.networkId,
        );
        const forwarder = new ForwarderWrapper(forwarderContract);
        return forwarder;
    }

    private async _quoteSelectedTokenAsync() {
        const { amount } = this.state;
        const { selectedToken, quote } = this.props;
        if (!this._hasQuoteForSelectedToken()) {
            const tokenPair: TokenPair = { maker: selectedToken, taker: AssetToken.WETH };
            this.props.dispatcher.quoteRequested(amount, tokenPair);
        }
    }

    private _hasQuoteForSelectedToken() {
        const { quote, selectedToken, networkId } = this.props;
        if (_.isUndefined(quote) || quote.pair.maker !== selectedToken || quote.networkId !== networkId) {
            return false;
        }
        return true;
    }
    private _computeTradeRanges(orders: SignedOrder[], fillUptoAmount: BigNumber): TradeRange[] {
        // TODO proper sort this
        const sortedOrders = _.sortBy(orders, order => {
            return order.makerTokenAmount.div(order.takerTokenAmount);
        });
        const bestEstimate = this._computeTradeEstimate(sortedOrders, fillUptoAmount);
        const worstEstimate = this._computeTradeEstimate(sortedOrders.reverse(), fillUptoAmount);
        return [bestEstimate, worstEstimate];
    }

    private _computeTradeEstimate(orders: SignedOrder[], fillUptoAmount: BigNumber): TradeRange {
        let filled = new BigNumber(0);
        let tokens = new BigNumber(0);
        orders.forEach(order => {
            if (filled.lessThan(fillUptoAmount)) {
                const orderFillableAmount = order.takerTokenAmount;
                const maxFillableAmount = BigNumber.min(orderFillableAmount, fillUptoAmount.minus(filled));
                const filledTakerTokens = order.makerTokenAmount.times(maxFillableAmount).div(order.takerTokenAmount);
                filled = filled.plus(maxFillableAmount);
                tokens = tokens.plus(filledTakerTokens);
            }
        });

        return { filled, tokens };
    }
}

// tslint:disable-next-line:no-default-export
export { BuyWidget };
