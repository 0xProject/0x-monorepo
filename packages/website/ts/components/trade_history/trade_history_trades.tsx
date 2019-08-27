import * as _ from 'lodash';
import Paper from 'material-ui/Paper';
import * as React from 'react';
import { TradeHistoryItem } from 'ts/components/trade_history/trade_history_item';
import { Fill, TokenByAddress } from 'ts/types';

interface TradeHistoryTradesProps {
    tokenByAddress: TokenByAddress;
    userAddress: string;
    networkId: number;
    fills: Fill[];
}

export const TradeHistoryTrades: React.FC<TradeHistoryTradesProps> = props => {
    let numNonCustomFills = 0;
    const tokens = _.values(props.tokenByAddress);

    _.each(props.fills, fill => {
        const takerToken = _.find(tokens, token => token.address === fill.takerToken);
        const makerToken = _.find(tokens, token => token.address === fill.makerToken);
        // For now we don't show history items for orders using custom ERC20
        // tokens the client does not know how to display.
        // TODO: Try to retrieve the name/symbol of an unknown token in order to display it
        // Be sure to remove similar logic in trade_history_item.tsx
        if (takerToken !== undefined && makerToken !== undefined) {
            numNonCustomFills += 1;
        }
    });

    if (numNonCustomFills === 0) {
        return <EmptyNotice />;
    }

    return (
        <>
            {props.fills.map((fill: Fill, index: number) => (
                <TradeHistoryItem
                    key={`${fill.orderHash}-${fill.filledTakerTokenAmount}-${index}`}
                    fill={fill}
                    tokenByAddress={props.tokenByAddress}
                    userAddress={props.userAddress}
                    networkId={props.networkId}
                />
            ))}
        </>
    );
};

const EmptyNotice: React.FC = () => (
    <Paper className="mt1 p2 mx-auto center" style={{ width: '80%' }}>
        No filled orders yet.
    </Paper>
);
