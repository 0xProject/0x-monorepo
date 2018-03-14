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

const TEST_NETWORK_ID = 50;
const TEST_RPC = 'http://127.0.0.1:8545';

const providerEngine = new Web3ProviderEngine();
providerEngine.addProvider(new InjectedWeb3Subprovider((window as any).web3.currentProvider));
providerEngine.addProvider(new RedundantRPCSubprovider([TEST_RPC]));
providerEngine.start();

const web3 = new Web3(providerEngine);
const web3Wrapper = new Web3Wrapper(web3.currentProvider);

const artifactJSONs = _.values(artifacts);
const abiArrays = _.map(artifactJSONs, artifact => artifact.networks[50].abi);
const abiDecoder = new AbiDecoder(abiArrays);

const forwarder = new ForwarderWrapper(web3Wrapper, TEST_NETWORK_ID, abiDecoder);
const zeroEx = new ZeroEx(web3.currentProvider, { networkId: TEST_NETWORK_ID });

// Source an Order, perhaps from your own Maker
const portalOrder = {
    signedOrder: {
        maker: '0x5409ed021d9299bf6814279a6a1411a7e866a631',
        taker: '0x0000000000000000000000000000000000000000',
        makerFee: '0',
        takerFee: '0',
        makerTokenAmount: '10000000000000000000000',
        takerTokenAmount: '10000000000000000000',
        makerTokenAddress: '0x1d7022f5b17d2f8b695918fb48fa1089c9f85401',
        takerTokenAddress: '0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
        expirationUnixTimestampSec: '2524626000',
        feeRecipient: '0x0000000000000000000000000000000000000000',
        salt: '52533589029956344021213327064411678088977266951393342018026333015237649941570',
        ecSignature: {
            v: 28,
            r: '0x9b615d85cfaed0745853ced7f446cd7e8956a1ebc45efa1c51c1abdf71b8447c',
            s: '0x18a6b7c49285f591653a31f67bf6e7361444f1dc233909c9a7e387497624cf67',
        },
        exchangeContractAddress: '0x48bacb9266a570d521063ef5dd96e61686dbe788',
    },
    metadata: {
        makerToken: {
            name: '0x Protocol Token',
            symbol: 'ZRX',
            decimals: 18,
        },
        takerToken: {
            name: 'Ether Token',
            symbol: 'WETH',
            decimals: 18,
        },
    },
};

function convertPortalOrder(json: any): SignedOrder {
    const rawSignedOrder = json.signedOrder;
    rawSignedOrder.makerFee = new BigNumber(rawSignedOrder.makerFee);
    rawSignedOrder.takerFee = new BigNumber(rawSignedOrder.takerFee);
    rawSignedOrder.makerTokenAmount = new BigNumber(rawSignedOrder.makerTokenAmount);
    rawSignedOrder.takerTokenAmount = new BigNumber(rawSignedOrder.takerTokenAmount);
    rawSignedOrder.expirationUnixTimestampSec = new BigNumber(rawSignedOrder.expirationUnixTimestampSec);
    rawSignedOrder.salt = new BigNumber(rawSignedOrder.salt);
    return rawSignedOrder;
}

async function fillOrder(fillAmount: BigNumber, signedOrder: SignedOrder) {
    const addresses = await web3Wrapper.getAvailableAddressesAsync();
    const msgSender = addresses[0];
    const txHash = await forwarder.fillOrderAsync(signedOrder, fillAmount, msgSender);
    const receipt = await zeroEx.awaitTransactionMinedAsync(txHash);
}

interface BuyWidgetPropTypes {}

interface BuyWidgetState {
    amount?: BigNumber;
    order?: SignedOrder;
    account?: string;
    balance?: string;
    tokenBalance?: string;
    isTransactionActive: boolean;
    selectedToken?: string;
}

class BuyWidget extends React.Component<BuyWidgetPropTypes, BuyWidgetState> {
    constructor(props: any) {
        super(props);
        this.state = {
            amount: new BigNumber(1),
            order: convertPortalOrder(portalOrder),
            account: undefined,
            balance: undefined,
            tokenBalance: undefined,
            selectedToken: 'ZRX',
            isTransactionActive: true,
        };

        this.handleAmountChange = this.handleAmountChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    // tslint:disable-next-line:member-access
    async componentDidMount() {
        await this.updateState();
    }

    // tslint:disable-next-line:member-access
    async updateState() {
        this.setState((prev, props) => {
            return { ...prev, isTransactionActive: true };
        });
        const addresses = await web3Wrapper.getAvailableAddressesAsync();
        const address = addresses[0];
        const addressBalance = await web3Wrapper.getBalanceInWeiAsync(address);
        const ethAddressBalance = ZeroEx.toUnitAmount(addressBalance, 18).round(4);
        const rawTokenBalance = await zeroEx.token.getBalanceAsync(this.state.order.makerTokenAddress, address);
        const tokenBalance = ZeroEx.toUnitAmount(rawTokenBalance, 18);
        this.setState((prev, props) => {
            return {
                ...prev,
                account: address,
                balance: ethAddressBalance.toString(),
                isTransactionActive: false,
                tokenBalance: tokenBalance.toString(),
            };
        });
    }

    public handleAmountChange(event: any) {
        event.preventDefault();
        const rawValue = event.target.value;
        let value: undefined | BigNumber;
        if (!_.isUndefined(rawValue) && !_.isEmpty(rawValue)) {
            const ethValue = new BigNumber(rawValue);
            const fillAmount = ZeroEx.toBaseUnitAmount(ethValue, 18);
            value = fillAmount;
        }
        this.setState((prev, props) => {
            return { ...prev, amount: value };
        });
    }

    public async handleSubmit(event: any) {
        event.preventDefault();
        this.setState((prev, props) => {
            return { ...prev, isTransactionActive: true };
        });
        const fillAmount = this.state.amount;
        await fillOrder(fillAmount, this.state.order);
        await this.updateState();
    }
    // tslint:disable-next-line:prefer-function-over-method member-access
    render() {
        return (
            <Content>
                <AccountBlockie
                    account={this.state.account}
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
                        isLoading={this.state.isTransactionActive}
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
}

// tslint:disable-next-line:no-default-export
export { BuyWidget };
