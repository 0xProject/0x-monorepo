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

import AccountBlockie from '../AccountBlockie';
import TokenSelector from '../TokenSelector';

const artifactJSONs = _.values(artifacts);
const abiArrays = _.map(artifactJSONs, artifact => artifact.networks[50].abi);
const abiDecoder = new AbiDecoder(abiArrays);

interface BuyWidgetPropTypes {
    onTokenChange?: (token: string) => any;
    onAmountChange?: (amount: BigNumber) => any;
    onTransactionSubmitted?: (txHash: string) => any;
    address: string;
    order?: SignedOrder;
    web3Wrapper: Web3Wrapper;
    zeroEx: ZeroEx;
}

interface BuyWidgetState {
    amount?: BigNumber;
    balance?: string;
    tokenBalance?: string;
    isLoading: boolean;
    selectedToken?: string;
}

const ETH_DECIMAL_PLACES = 18;
class BuyWidget extends React.Component<BuyWidgetPropTypes, BuyWidgetState> {
    private _forwarder: ForwarderWrapper;
    constructor(props: any) {
        super(props);
        this.state = {
            amount: new BigNumber(1),
            balance: undefined,
            tokenBalance: undefined,
            selectedToken: 'ZRX',
            isLoading: false,
        };

        this.handleAmountChange = this.handleAmountChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        // TODO remove 50 constant here
        this._forwarder = new ForwarderWrapper(this.props.web3Wrapper, 50, abiDecoder);
    }

    // tslint:disable-next-line:member-access
    async componentDidMount() {
        await this.updateState();
    }

    // tslint:disable-next-line:member-access
    async componentWillReceiveProps(nextProps: BuyWidgetPropTypes) {
        // tslint:disable-next-line:no-console
        console.log('received new props', nextProps);
        this.props = nextProps;
        await this.updateState();
    }

    // tslint:disable-next-line:prefer-function-over-method member-access
    render() {
        return (
            <Content>
                <AccountBlockie
                    account={this.props.address}
                    ethBalance={this.state.balance}
                    tokenBalance={this.state.tokenBalance}
                    selectedToken={this.state.selectedToken}
                />
                <Label isSize="small">SELECT TOKEN</Label>
                <Field isFullWidth={true}>
                    <TokenSelector />
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
                    <Button
                        isLoading={this.state.isLoading}
                        isFullWidth={true}
                        isColor="info"
                        onClick={this.handleSubmit}
                    >
                        SUBMIT ORDER
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
        const txHash = await this._fillOrderAsync(this.props.address, this.state.amount, this.props.order);
        this.setState((prev, props) => {
            return { ...prev, isLoading: false };
        });
        await this.updateState();
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

    // tslint:disable-next-line:member-access underscore-private-and-protected
    private async updateState() {
        // tslint:disable-next-line:no-console
        console.log('updating state', this.props.address);
        if (!_.isUndefined(this.props.address)) {
            const addressBalance = await this.props.web3Wrapper.getBalanceInWeiAsync(this.props.address);
            const ethAddressBalance = ZeroEx.toUnitAmount(addressBalance, ETH_DECIMAL_PLACES).toFixed(4);
            let tokenBalance = new BigNumber(0);
            if (!_.isUndefined(this.props.order)) {
                const rawTokenBalance = await this.props.zeroEx.token.getBalanceAsync(
                    this.props.order.makerTokenAddress,
                    this.props.address,
                );
                tokenBalance = ZeroEx.toUnitAmount(rawTokenBalance, ETH_DECIMAL_PLACES);
            }
            this.setState((prev, props) => {
                return {
                    ...prev,
                    balance: ethAddressBalance.toString(),
                    tokenBalance: tokenBalance.toString(),
                };
            });
        }
    }

    private async _fillOrderAsync(
        takerAddress: string,
        fillAmount: BigNumber,
        signedOrder: SignedOrder,
    ): Promise<string> {
        const txHash = await this._forwarder.fillOrderAsync(signedOrder, fillAmount, takerAddress);
        const receipt = await this.props.zeroEx.awaitTransactionMinedAsync(txHash);
        return txHash;
    }
}

// tslint:disable-next-line:no-default-export
export { BuyWidget };
