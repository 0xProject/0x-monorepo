import * as React from 'react';
import { render } from 'react-dom';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Web3ProviderEngine, RPCSubprovider } from '@0x/subproviders';
import { SwapQuoter, SwapQuoteRequestOpts, ERC20BridgeSource, MarketSellSwapQuote } from '@0x/asset-swapper';

import { Nav } from './components/nav';
import { RequestForm } from './components/request_form';
import { RequestResults } from './components/request_results';
import { providerUtils, BigNumber } from '@0x/utils';
import { getTokenInfo } from './utils';
import { ASSET_SWAPPER_MARKET_ORDERS_OPTS } from './asset_swapper_opts';

const SRA_URL = 'https://api.0x.org/sra/';
const CHAIN_ID = 1;

const constructWeb3Wrapper = () => {
    const providerEngine = new Web3ProviderEngine();
    const rpcUri = process.env.RPC_URI;
    if (!rpcUri) {
        alert('No RPC URI defined');
    }
    providerEngine.addProvider(new RPCSubprovider(rpcUri!));
    providerUtils.startProviderEngine(providerEngine);
    return new Web3Wrapper(providerEngine);
};
const web3Wrapper = constructWeb3Wrapper();

export interface AppState {
    requestState: 'loading' | 'error' | 'done';
}

export class App extends React.Component<{}, AppState> {
    constructor(props: {}) {
        super(props);
        this.onSubmit = this.onSubmit.bind(this);
    }
    async onSubmit(requestInfo: {
        sellToken: string;
        buyToken: string;
        sellAmount: number;
        rfqtUrl: string;
        apiKey: string;
        takerAddress: string;
    }) {
        const quoter = SwapQuoter.getSwapQuoterForStandardRelayerAPIUrl(web3Wrapper.getProvider(), SRA_URL, {
            chainId: CHAIN_ID,
            rfqt: {
                makerEndpoints: [requestInfo.rfqtUrl],
                takerApiKeyWhitelist: [requestInfo.apiKey],
            },
        });

        const [sellTokenAddress, sellTokenDecimals] = getTokenInfo(requestInfo.sellToken);
        const [buyTokenAddress, _buyTokenDecimals] = getTokenInfo(requestInfo.buyToken);
        this.setState({ requestState: 'loading' });

        let sellQuote: MarketSellSwapQuote;
        try {
            sellQuote = await quoter.getMarketSellSwapQuoteAsync(
                buyTokenAddress,
                sellTokenAddress,
                Web3Wrapper.toBaseUnitAmount(requestInfo.sellAmount, sellTokenDecimals),
                {
                    ...ASSET_SWAPPER_MARKET_ORDERS_OPTS,
                    rfqt: { apiKey: requestInfo.apiKey, intentOnFilling: true, takerAddress: requestInfo.takerAddress },
                },
            );
        } catch (e) {
            console.error(e);
            this.setState({ requestState: 'error' });
            return;
        }

        this.setState({ requestState: 'done' });
    }
    render() {
        return (
            <div style={{ fontFamily: 'Courier New' }}>
                <Nav />

                <div style={{ marginTop: '20px', marginLeft: '20px' }}>
                    <RequestForm onSubmit={this.onSubmit} />
                    <div style={{ float: 'left', minWidth: '750px' }}>
                        <RequestResults {...this.state} />
                    </div>
                </div>
            </div>
        );
    }
}

render(<App />, document.getElementById('root'));
