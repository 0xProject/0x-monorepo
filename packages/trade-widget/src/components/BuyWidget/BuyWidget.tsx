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

import { artifacts } from '../../artifacts';
import { ForwarderWrapper } from '../../contract_wrappers/forwarder_wrapper';

import { Dispatcher } from '../../redux/dispatcher';
import { AccountTokenBalances, AccountWeiBalances, AssetToken, TokenBalances } from '../../types';
import AccountBlockie from '../AccountBlockie';
import TokenSelector from '../TokenSelector';

interface BuyWidgetPropTypes {
    onTokenChange?: (token: string) => any;
    onAmountChange?: (amount: BigNumber) => any;
    onTransactionSubmitted?: (txHash: string) => any;
    address: string;
    networkId: number;
    weiBalances: AccountWeiBalances;
    tokenBalances: AccountTokenBalances;
    selectedToken: AssetToken;
    order: SignedOrder;
    web3Wrapper: Web3Wrapper;
    zeroEx: ZeroEx;
    dispatcher: Dispatcher;
}

interface BuyWidgetState {
    amount?: BigNumber;
    isLoading: boolean;
}

const ETH_DECIMAL_PLACES = 18;
class BuyWidget extends React.Component<BuyWidgetPropTypes, BuyWidgetState> {
    private _forwarder: ForwarderWrapper;
    constructor(props: any) {
        super(props);
        this.state = {
            amount: new BigNumber(1),
            isLoading: false,
        };

        this.handleAmountChange = this.handleAmountChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    // tslint:disable-next-line:prefer-function-over-method member-access
    render() {
        const { isLoading } = this.state;
        const { address, weiBalances, tokenBalances, selectedToken } = this.props;
        const tokenBalance = tokenBalances[address] ? tokenBalances[address][selectedToken] : new BigNumber(0);
        const weiBalance = weiBalances[address] || new BigNumber(0);
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
                        onChange={this.handleTokenSelected.bind(this)}
                    />
                </Field>
                <Label style={{ marginTop: 30 }} isSize="small">
                    BUY AMOUNT
                </Label>
                <Field hasAddons={true}>
                    <Control isExpanded={true}>
                        <Input type="text" placeholder="1" onChange={this.handleAmountChange.bind(this)} />
                    </Control>
                    <Control>
                        <Select>
                            <option>ETH</option>
                            <option>ZRX</option>
                        </Select>
                    </Control>
                </Field>
                {/* <Field>
                    <strong> ESTIMATED COST </strong>
                </Field> */}
                <Field style={{ marginTop: 20 }}>
                    <Button isLoading={isLoading} isFullWidth={true} isColor="info" onClick={this.handleSubmit}>
                        BUY TOKENS
                    </Button>
                </Field>
                <Field style={{ marginTop: 20 }} isGrouped={'centered'}>
                    <img style={{ marginLeft: '0px', height: '20px' }} src="/images/powered.png" />
                </Field>
            </Content>
        );
    }

    // tslint:disable-next-line:underscore-private-and-protected
    private async handleSubmit(event: any) {
        event.preventDefault();
        this.setState((prev, props) => {
            return { ...prev, isLoading: true };
        });
        const { address, order } = this.props;
        const { amount } = this.state;
        const txHash = await this._fillOrderAsync(address, amount, order);
        this.setState((prev, props) => {
            return { ...prev, isLoading: false };
        });
    }

    // tslint:disable-next-line:underscore-private-and-protected
    private handleAmountChange(event: any) {
        event.preventDefault();
        const rawValue = event.target.value;
        let value: undefined | BigNumber;
        if (!_.isUndefined(rawValue) && !_.isEmpty(rawValue)) {
            const ethValue = new BigNumber(rawValue);
            const fillAmount = ZeroEx.toBaseUnitAmount(ethValue, ETH_DECIMAL_PLACES);
            value = fillAmount;
        }
        this.setState((prev, props) => {
            return { ...prev, amount: value };
        });
    }

    // tslint:disable-next-line:underscore-private-and-protected
    private async handleTokenSelected(event: any, token: AssetToken) {
        this.props.dispatcher.updateSelectedToken(token);
    }

    private async _fillOrderAsync(
        takerAddress: string,
        fillAmount: BigNumber,
        signedOrder: SignedOrder,
    ): Promise<string> {
        const txHash = await this._getForwarder().fillOrderAsync(signedOrder, fillAmount, takerAddress);
        this.props.dispatcher.transactionSubmitted(txHash);
        const receipt = await this.props.zeroEx.awaitTransactionMinedAsync(txHash);
        this.props.dispatcher.transactionMined(receipt);
        return txHash;
    }

    private _getForwarder(): ForwarderWrapper {
        const artifactJSONs = _.values(artifacts);
        const abiArrays = _.map(artifactJSONs, artifact => artifact.networks[this.props.networkId].abi);
        const abiDecoder = new AbiDecoder(abiArrays);
        this._forwarder = new ForwarderWrapper(this.props.web3Wrapper, this.props.networkId, abiDecoder);
        return this._forwarder;
    }
}

// tslint:disable-next-line:no-default-export
export { BuyWidget };
