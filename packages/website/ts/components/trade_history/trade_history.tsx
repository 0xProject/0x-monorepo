import * as _ from 'lodash';
import Divider from 'material-ui/Divider';
import * as React from 'react';
import { TradeHistoryTrades } from 'ts/components/trade_history/trade_history_trades';
import { tradeHistoryStorage } from 'ts/local_storage/trade_history_storage';
import { Fill, TokenByAddress } from 'ts/types';
import { utils } from 'ts/utils/utils';

const FILL_POLLING_INTERVAL = 1000;

interface TradeHistoryProps {
    tokenByAddress: TokenByAddress;
    userAddress: string;
    networkId: number;
    isFullWidth?: boolean;
    shouldHideHeader?: boolean;
    isScrollable?: boolean;
}

const defaultProps = {
    isFullWidth: false,
    shouldHideHeader: false,
    isScrollable: true,
};

export const TradeHistory: React.FC<TradeHistoryProps> = props => {
    const [fills, setFills] = React.useState<Fill[]>(getSortedFills());

    React.useEffect(() => {
        window.scrollTo(0, 0);

        const interval = window.setInterval(() => {
            const sortedFills = getSortedFills();
            if (!utils.deepEqual(sortedFills, fills)) {
                setFills(sortedFills);
            }
        }, FILL_POLLING_INTERVAL);

        return () => clearInterval(interval);
    }, []);

    function getSortedFills(): Fill[] {
        const fillsByHash = tradeHistoryStorage.getUserFillsByHash(props.userAddress, props.networkId);
        const fillsValues = _.values(fillsByHash);
        const sortedFills = _.sortBy(fillsValues, [(fill: Fill) => fill.blockTimestamp * -1]);
        return sortedFills;
    }

    const rootClassName = !props.isFullWidth ? 'lg-px4 md-px4 sm-px2' : undefined;

    return (
        <div className={rootClassName}>
            {!props.shouldHideHeader && (
                <div>
                    <h3>Trade history</h3>
                    <Divider />
                </div>
            )}
            {props.isScrollable ? (
                <div className="pt2" style={{ height: 608, overflow: 'scroll' }}>
                    <TradeHistoryTrades {...props} fills={fills} />
                </div>
            ) : (
                <TradeHistoryTrades {...props} fills={fills} />
            )}
        </div>
    );
};

TradeHistory.defaultProps = defaultProps;
