import { SignedOrder, ZeroEx } from '0x.js';
import { InjectedWeb3Subprovider, RedundantRPCSubprovider } from '@0xproject/subproviders';
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
    Input,
    Label,
    TextArea,
} from 'bloomer';
import 'bulma/css/bulma.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Web3 from 'web3';
import * as Web3ProviderEngine from 'web3-provider-engine';

import './App.css';
import BuyWidget from './components/BuyWidget';
import './index.css';
import registerServiceWorker from './registerServiceWorker';

import { FixedProvider } from './liquidity_providers/fixed_provider';

const TEST_NETWORK_ID = 50;
const TEST_RPC = 'http://127.0.0.1:8545';

const providerEngine = new Web3ProviderEngine();
providerEngine.addProvider(new InjectedWeb3Subprovider((window as any).web3.currentProvider));
providerEngine.addProvider(new RedundantRPCSubprovider([TEST_RPC]));
providerEngine.start();

const web3Wrapper = new Web3Wrapper(providerEngine);
const zeroEx = new ZeroEx(providerEngine, { networkId: TEST_NETWORK_ID });

interface AppState {
    address: string;
    order: SignedOrder;
}
// TODO I don't like how there is state of order here and props of order in the BuyWidget
class App extends React.Component<{}, AppState> {
    private _provider: FixedProvider;
    constructor(props: {}) {
        super(props);
        this.state = {
            address: undefined,
            order: undefined,
        };
        this._provider = new FixedProvider(this._orderUpdatedAsync.bind(this));
    }
    // tslint:disable-next-line:member-access
    async componentDidMount() {
        await this._fetchAccountsAsync();
        await this._provider.start();
    }
    // tslint:disable-next-line:prefer-function-over-method member-access
    render() {
        return (
            <Container style={{ marginTop: 20, marginLeft: 20 }}>
                <Content>
                    <Columns>
                        <Column isSize={{ mobile: 12, default: '1/4' }}>
                            <Card>
                                <CardHeaderTitle>
                                    <Label isSize={'small'}>0x TRADE WIDGET</Label>
                                </CardHeaderTitle>
                                <CardContent>
                                    <BuyWidget
                                        address={this.state.address}
                                        order={this.state.order}
                                        zeroEx={zeroEx}
                                        web3Wrapper={web3Wrapper}
                                    />
                                </CardContent>
                            </Card>
                        </Column>
                    </Columns>
                </Content>
            </Container>
        );
    }
    private async _fetchAccountsAsync(): Promise<void> {
        const address = (await web3Wrapper.getAvailableAddressesAsync())[0];
        this.setState((prev, _) => {
            return { ...prev, address };
        });
    }
    private async _orderUpdatedAsync(order: SignedOrder): Promise<void> {
        this.setState((prev, _) => {
            return { ...prev, order };
        });
    }
}

// tslint:disable-next-line:no-default-export
export default App;
