import * as _ from 'lodash';
import * as React from 'react';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import {utils} from 'ts/utils/utils';
import {Fill, TokenByAddress} from 'ts/types';
import {TradeHistoryItem} from 'ts/components/trade_history/trade_history_item';
import {tradeHistoryStorage} from 'ts/local_storage/trade_history_storage';

const FILL_POLLING_INTERVAL = 1000;

interface TradeHistoryProps {
    tokenByAddress: TokenByAddress;
    userAddress: string;
    networkId: number;
}

interface TradeHistoryState {
    sortedFills: Fill[];
}

export class TradeHistory extends React.Component<TradeHistoryProps, TradeHistoryState> {
    private fillPollingIntervalId: number;
    public constructor(props: TradeHistoryProps) {
        super(props);
        const sortedFills = this.getSortedFills();
        this.state = {
            sortedFills,
        };
    }
    public componentWillMount() {
        this.startPollingForFills();
    }
    public componentWillUnmount() {
        this.stopPollingForFills();
    }
    public componentDidMount() {
        window.scrollTo(0, 0);
    }
    public render() {
        return (
            <div className="lg-px4 md-px4 sm-px2">
                <h3>Trade history</h3>
                <Divider />
                <div className="pt2" style={{height: 608, overflow: 'scroll'}}>
                    {this.renderTrades()}
                </div>
            </div>
        );
    }
    private renderTrades() {
        const numNonCustomFills = this.numFillsWithoutCustomERC20Tokens();
        if (numNonCustomFills === 0) {
            return this.renderEmptyNotice();
        }

        return _.map(this.state.sortedFills, (fill, index) => {
            return (
                <TradeHistoryItem
                    key={`${fill.orderHash}-${fill.filledTakerTokenAmount}-${index}`}
                    fill={fill}
                    tokenByAddress={this.props.tokenByAddress}
                    userAddress={this.props.userAddress}
                    networkId={this.props.networkId}
                />
            );
        });
    }
    private renderEmptyNotice() {
        return (
            <Paper className="mt1 p2 mx-auto center" style={{width: '80%'}}>
                No filled orders yet.
            </Paper>
        );
    }
    private numFillsWithoutCustomERC20Tokens() {
        let numNonCustomFills = 0;
        const tokens = _.values(this.props.tokenByAddress);
        _.each(this.state.sortedFills, fill => {
            const takerToken = _.find(tokens, token => {
                return token.address === fill.takerToken;
            });
            const makerToken = _.find(tokens, token => {
                return token.address === fill.makerToken;
            });
            // For now we don't show history items for orders using custom ERC20
            // tokens the client does not know how to display.
            // TODO: Try to retrieve the name/symbol of an unknown token in order to display it
            // Be sure to remove similar logic in trade_history_item.tsx
            if (!_.isUndefined(takerToken) && !_.isUndefined(makerToken)) {
                numNonCustomFills += 1;
            }
        });
        return numNonCustomFills;
    }
    private startPollingForFills() {
        this.fillPollingIntervalId = window.setInterval(() => {
            const sortedFills = this.getSortedFills();
            if (!utils.deepEqual(sortedFills, this.state.sortedFills)) {
                this.setState({
                    sortedFills,
                });
            }
        }, FILL_POLLING_INTERVAL);
    }
    private stopPollingForFills() {
        clearInterval(this.fillPollingIntervalId);
    }
    private getSortedFills() {
        const fillsByHash = tradeHistoryStorage.getUserFillsByHash(this.props.userAddress, this.props.networkId);
        const fills = _.values(fillsByHash);
        const sortedFills = _.sortBy(fills, [(fill: Fill) => fill.blockTimestamp * -1]);
        return sortedFills;
    }
}
