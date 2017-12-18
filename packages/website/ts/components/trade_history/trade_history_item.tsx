import {ZeroEx} from '0x.js';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import Paper from 'material-ui/Paper';
import {colors} from 'material-ui/styles';
import * as moment from 'moment';
import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';
import {EtherScanIcon} from 'ts/components/ui/etherscan_icon';
import {Party} from 'ts/components/ui/party';
import {EtherscanLinkSuffixes, Fill, Token, TokenByAddress} from 'ts/types';

const PRECISION = 5;
const IDENTICON_DIAMETER = 40;

interface TradeHistoryItemProps {
    fill: Fill;
    tokenByAddress: TokenByAddress;
    userAddress: string;
    networkId: number;
}

interface TradeHistoryItemState {}

export class TradeHistoryItem extends React.Component<TradeHistoryItemProps, TradeHistoryItemState> {
    public render() {
        const fill = this.props.fill;
        const tokens = _.values(this.props.tokenByAddress);
        const takerToken = _.find(tokens, token => {
            return token.address === fill.takerToken;
        });
        const makerToken = _.find(tokens, token => {
            return token.address === fill.makerToken;
        });
        // For now we don't show history items for orders using custom ERC20
        // tokens the client does not know how to display.
        // TODO: Try to retrieve the name/symbol of an unknown token in order to display it
        // Be sure to remove similar logic in trade_history.tsx
        if (_.isUndefined(takerToken) || _.isUndefined(makerToken)) {
            return null;
        }

        const amountColStyle: React.CSSProperties = {
            fontWeight: 100,
            display: 'inline-block',
        };
        const amountColClassNames = 'col col-12 lg-col-4 md-col-4 lg-py2 md-py2 sm-py1 lg-pr2 md-pr2 \
                                     lg-right-align md-right-align sm-center';

        return (
            <Paper
                className="py1"
                style={{margin: '3px 3px 15px 3px'}}
            >
                <div className="clearfix">
                    <div className="col col-12 lg-col-1 md-col-1 pt2 lg-pl3 md-pl3">
                        {this.renderDate()}
                    </div>
                    <div
                        className="col col-12 lg-col-6 md-col-6 lg-pl3 md-pl3"
                        style={{fontSize: 12, fontWeight: 100}}
                    >
                        <div className="flex sm-mx-auto xs-mx-auto" style={{paddingTop: 4, width: 224}}>
                            <Party
                                label="Maker"
                                address={fill.maker}
                                identiconDiameter={IDENTICON_DIAMETER}
                                networkId={this.props.networkId}
                            />
                            <i style={{fontSize: 30}} className="zmdi zmdi-swap py3" />
                            <Party
                                label="Taker"
                                address={fill.taker}
                                identiconDiameter={IDENTICON_DIAMETER}
                                networkId={this.props.networkId}
                            />
                        </div>
                    </div>
                    <div
                        className={amountColClassNames}
                        style={amountColStyle}
                    >
                        {this.renderAmounts(makerToken, takerToken)}
                    </div>
                    <div className="col col-12 lg-col-1 md-col-1 lg-pr3 md-pr3 lg-py3 md-py3 sm-pb1 sm-center">
                        <div className="pt1 lg-right md-right sm-mx-auto" style={{width: 13}}>
                            <EtherScanIcon
                                addressOrTxHash={fill.transactionHash}
                                networkId={this.props.networkId}
                                etherscanLinkSuffixes={EtherscanLinkSuffixes.Tx}
                            />
                        </div>
                    </div>
                </div>
            </Paper>
        );
    }
    private renderAmounts(makerToken: Token, takerToken: Token) {
        const fill = this.props.fill;
        const filledTakerTokenAmountInUnits = ZeroEx.toUnitAmount(fill.filledTakerTokenAmount, takerToken.decimals);
        const filledMakerTokenAmountInUnits = ZeroEx.toUnitAmount(fill.filledMakerTokenAmount, takerToken.decimals);
        let exchangeRate = filledTakerTokenAmountInUnits.div(filledMakerTokenAmountInUnits);
        const fillMakerTokenAmount = ZeroEx.toBaseUnitAmount(filledMakerTokenAmountInUnits, makerToken.decimals);

        let receiveAmount;
        let receiveToken;
        let givenAmount;
        let givenToken;
        if (this.props.userAddress === fill.maker && this.props.userAddress === fill.taker) {
            receiveAmount = new BigNumber(0);
            givenAmount = new BigNumber(0);
            receiveToken = makerToken;
            givenToken = takerToken;
        } else if (this.props.userAddress === fill.maker) {
            receiveAmount = fill.filledTakerTokenAmount;
            givenAmount = fillMakerTokenAmount;
            receiveToken = takerToken;
            givenToken = makerToken;
            exchangeRate = new BigNumber(1).div(exchangeRate);
        } else if (this.props.userAddress === fill.taker) {
            receiveAmount = fillMakerTokenAmount;
            givenAmount = fill.filledTakerTokenAmount;
            receiveToken = makerToken;
            givenToken = takerToken;
        } else {
            // This condition should never be hit
            throw new Error('Found Fill that wasn\'t performed by this user');
        }

        return (
            <div>
                <div
                    style={{color: colors.green400, fontSize: 16}}
                >
                    <span>+{' '}</span>
                    {this.renderAmount(receiveAmount, receiveToken.symbol, receiveToken.decimals)}
                </div>
                <div
                    className="pb1 inline-block"
                    style={{color: colors.red200, fontSize: 16}}
                >
                    <span>-{' '}</span>
                    {this.renderAmount(givenAmount, givenToken.symbol, givenToken.decimals)}
                </div>
                <div style={{color: colors.grey400, fontSize: 14}}>
                    {exchangeRate.toFixed(PRECISION)} {givenToken.symbol}/{receiveToken.symbol}
                </div>
            </div>
        );
    }
    private renderDate() {
        const blockMoment = moment.unix(this.props.fill.blockTimestamp);
        if (!blockMoment.isValid()) {
            return null;
        }

        const dayOfMonth = blockMoment.format('D');
        const monthAbreviation = blockMoment.format('MMM');
        const formattedBlockDate = blockMoment.format('H:mmA - MMMM D, YYYY');
        const dateTooltipId = `${this.props.fill.transactionHash}-date`;

        return (
            <div
                data-tip={true}
                data-for={dateTooltipId}
            >
                <div className="center pt1" style={{fontSize: 13}}>{monthAbreviation}</div>
                <div className="center" style={{fontSize: 24, fontWeight: 100}}>{dayOfMonth}</div>
                <ReactTooltip id={dateTooltipId}>{formattedBlockDate}</ReactTooltip>
            </div>
        );
    }
    private renderAmount(amount: BigNumber, symbol: string, decimals: number) {
        const unitAmount = ZeroEx.toUnitAmount(amount, decimals);
        return (
            <span>
                {unitAmount.toFixed(PRECISION)} {symbol}
            </span>
        );
    }
}
