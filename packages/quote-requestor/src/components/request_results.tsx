import * as React from 'react';
import ReactJson from 'react-json-view';
import { AppState } from '..';
import { MarketSellSwapQuote } from '@0x/asset-swapper';

interface RequestResultsProps extends AppState {}

export class RequestResults extends React.Component<RequestResultsProps, {}> {
    renderStatus() {
        if (this.props.requestState == 'loading') {
            return 'Loading...';
        }
        if (this.props.requestState === 'error') {
            return '⚠️ Error';
        }
        return '';
    }

    renderQuote(quote: MarketSellSwapQuote) {
        return (
            <div>
                <ReactJson src={quote} />
            </div>
        );
    }

    render() {
        return (
            <div style={{ maxWidth: '700px' }}>
                {this.renderStatus()}
                {this.props.sellQuote ? this.renderQuote(this.props.sellQuote) : ''}
            </div>
        );
    }
}
