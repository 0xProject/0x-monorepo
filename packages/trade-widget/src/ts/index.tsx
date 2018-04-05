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
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, compose, createStore, Store as ReduxStore } from 'redux';
import thunk from 'redux-thunk';
import * as Web3 from 'web3';
// tslint:disable-next-line:no-var-requires
const Web3ProviderEngine = require('web3-provider-engine');

// import './App.css';
import { BuyWidget } from './containers/buy_widget';
// import './index.css';

import { FixedProvider } from './liquidity_providers/fixed_provider';
import { Dispatcher } from './redux/dispatcher';
import { reducer, State } from './redux/reducer';
import { BlockchainSaga } from './sagas/blockchain_saga';
import { AssetToken } from './types';

const TEST_NETWORK_ID = 50;
const TEST_RPC = 'http://127.0.0.1:8545';

const providerEngine = new Web3ProviderEngine();
providerEngine.addProvider(new InjectedWeb3Subprovider((window as any).web3.currentProvider));
providerEngine.addProvider(new RedundantRPCSubprovider([TEST_RPC]));
providerEngine.start();

const web3Wrapper = new Web3Wrapper(providerEngine);
const zeroEx = new ZeroEx(providerEngine, { networkId: TEST_NETWORK_ID });

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store: ReduxStore<State> = createStore(reducer, composeEnhancers(applyMiddleware(thunk)));

const liquidityProvider = new FixedProvider();
const dispatcher = new Dispatcher(store.dispatch, liquidityProvider);
const blockchainSaga = new BlockchainSaga(dispatcher, store, web3Wrapper, zeroEx);

render(
    <Provider store={store}>
        <Container style={{ marginTop: 20, marginLeft: 20 }}>
            <Content>
                <Columns>
                    <Column isSize={{ mobile: 12, default: '1/4' }}>
                        <Card>
                            <CardHeaderTitle>
                                <Label isSize={'small'}>0x TRADE WIDGET</Label>
                            </CardHeaderTitle>
                            <CardContent>
                                <BuyWidget zeroEx={zeroEx} web3Wrapper={web3Wrapper} dispatcher={dispatcher} />
                            </CardContent>
                        </Card>
                    </Column>
                </Columns>
            </Content>
        </Container>
    </Provider>,
    document.getElementById('app'),
);
