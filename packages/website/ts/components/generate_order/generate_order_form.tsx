import {Order, ZeroEx} from '0x.js';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import Divider from 'material-ui/Divider';
import {colors} from 'material-ui/styles';
import * as React from 'react';
import {Blockchain} from 'ts/blockchain';
import {ExpirationInput} from 'ts/components/inputs/expiration_input';
import {HashInput} from 'ts/components/inputs/hash_input';
import {IdenticonAddressInput} from 'ts/components/inputs/identicon_address_input';
import {TokenAmountInput} from 'ts/components/inputs/token_amount_input';
import {TokenInput} from 'ts/components/inputs/token_input';
import {OrderJSON} from 'ts/components/order_json';
import {Alert} from 'ts/components/ui/alert';
import {HelpTooltip} from 'ts/components/ui/help_tooltip';
import {LifeCycleRaisedButton} from 'ts/components/ui/lifecycle_raised_button';
import {SwapIcon} from 'ts/components/ui/swap_icon';
import {Dispatcher} from 'ts/redux/dispatcher';
import {orderSchema} from 'ts/schemas/order_schema';
import {SchemaValidator} from 'ts/schemas/validator';
import {
    AlertTypes,
    BlockchainErrs,
    HashData,
    Side,
    SideToAssetToken,
    SignatureData,
    Token,
    TokenByAddress,
    TokenStateByAddress,
} from 'ts/types';
import {errorReporter} from 'ts/utils/error_reporter';
import {utils} from 'ts/utils/utils';

enum SigningState {
    UNSIGNED,
    SIGNING,
    SIGNED,
}

interface GenerateOrderFormProps {
    blockchain: Blockchain;
    blockchainErr: BlockchainErrs;
    blockchainIsLoaded: boolean;
    dispatcher: Dispatcher;
    hashData: HashData;
    orderExpiryTimestamp: BigNumber;
    networkId: number;
    userAddress: string;
    orderSignatureData: SignatureData;
    orderTakerAddress: string;
    orderSalt: BigNumber;
    sideToAssetToken: SideToAssetToken;
    tokenByAddress: TokenByAddress;
    tokenStateByAddress: TokenStateByAddress;
}

interface GenerateOrderFormState {
    globalErrMsg: string;
    shouldShowIncompleteErrs: boolean;
    signingState: SigningState;
}

export class GenerateOrderForm extends React.Component<GenerateOrderFormProps, GenerateOrderFormState> {
    private validator: SchemaValidator;
    constructor(props: GenerateOrderFormProps) {
        super(props);
        this.state = {
            globalErrMsg: '',
            shouldShowIncompleteErrs: false,
            signingState: SigningState.UNSIGNED,
        };
        this.validator = new SchemaValidator();
    }
    public componentDidMount() {
        window.scrollTo(0, 0);
    }
    public render() {
        const dispatcher = this.props.dispatcher;
        const depositTokenAddress = this.props.sideToAssetToken[Side.deposit].address;
        const depositToken = this.props.tokenByAddress[depositTokenAddress];
        const depositTokenState = this.props.tokenStateByAddress[depositTokenAddress];
        const receiveTokenAddress = this.props.sideToAssetToken[Side.receive].address;
        const receiveToken = this.props.tokenByAddress[receiveTokenAddress];
        const receiveTokenState = this.props.tokenStateByAddress[receiveTokenAddress];
        const takerExplanation = 'If a taker is specified, only they are<br> \
                                  allowed to fill this order. If no taker is<br> \
                                  specified, anyone is able to fill it.';
        const exchangeContractIfExists = this.props.blockchain.getExchangeContractAddressIfExists();
        return (
            <div className="clearfix mb2 lg-px4 md-px4 sm-px2">
                <h3>Generate an order</h3>
                <Divider />
                <div className="mx-auto" style={{maxWidth: 580}}>
                    <div className="pt3">
                        <div className="mx-auto clearfix">
                            <div className="lg-col md-col lg-col-5 md-col-5 sm-col sm-col-5 sm-pb2">
                                <TokenInput
                                    userAddress={this.props.userAddress}
                                    blockchain={this.props.blockchain}
                                    blockchainErr={this.props.blockchainErr}
                                    dispatcher={this.props.dispatcher}
                                    label="Selling"
                                    side={Side.deposit}
                                    networkId={this.props.networkId}
                                    assetToken={this.props.sideToAssetToken[Side.deposit]}
                                    updateChosenAssetToken={dispatcher.updateChosenAssetToken.bind(dispatcher)}
                                    tokenByAddress={this.props.tokenByAddress}
                                />
                                <TokenAmountInput
                                    label="Sell amount"
                                    token={depositToken}
                                    tokenState={depositTokenState}
                                    amount={this.props.sideToAssetToken[Side.deposit].amount}
                                    onChange={this.onTokenAmountChange.bind(this, depositToken, Side.deposit)}
                                    shouldShowIncompleteErrs={this.state.shouldShowIncompleteErrs}
                                    shouldCheckBalance={true}
                                    shouldCheckAllowance={true}
                                />
                            </div>
                            <div className="lg-col md-col lg-col-2 md-col-2 sm-col sm-col-2 xs-hide">
                                <div className="p1">
                                    <SwapIcon
                                        swapTokensFn={dispatcher.swapAssetTokenSymbols.bind(dispatcher)}
                                    />
                                </div>
                            </div>
                            <div className="lg-col md-col lg-col-5 md-col-5 sm-col sm-col-5 sm-pb2">
                                <TokenInput
                                    userAddress={this.props.userAddress}
                                    blockchain={this.props.blockchain}
                                    blockchainErr={this.props.blockchainErr}
                                    dispatcher={this.props.dispatcher}
                                    label="Buying"
                                    side={Side.receive}
                                    networkId={this.props.networkId}
                                    assetToken={this.props.sideToAssetToken[Side.receive]}
                                    updateChosenAssetToken={dispatcher.updateChosenAssetToken.bind(dispatcher)}
                                    tokenByAddress={this.props.tokenByAddress}
                                />
                                <TokenAmountInput
                                    label="Receive amount"
                                    token={receiveToken}
                                    tokenState={receiveTokenState}
                                    amount={this.props.sideToAssetToken[Side.receive].amount}
                                    onChange={this.onTokenAmountChange.bind(this, receiveToken, Side.receive)}
                                    shouldShowIncompleteErrs={this.state.shouldShowIncompleteErrs}
                                    shouldCheckBalance={false}
                                    shouldCheckAllowance={false}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="pt1 sm-pb2 lg-px4 md-px4">
                        <div className="lg-px3 md-px3">
                            <div style={{fontSize: 12, color: colors.grey500}}>Expiration</div>
                            <ExpirationInput
                                orderExpiryTimestamp={this.props.orderExpiryTimestamp}
                                updateOrderExpiry={dispatcher.updateOrderExpiry.bind(dispatcher)}
                            />
                        </div>
                    </div>
                    <div className="pt1 flex mx-auto">
                        <IdenticonAddressInput
                            label="Taker"
                            initialAddress={this.props.orderTakerAddress}
                            updateOrderAddress={this.updateOrderAddress.bind(this)}
                        />
                        <div className="pt3">
                            <div className="pl1">
                                <HelpTooltip
                                    explanation={takerExplanation}
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <HashInput
                            blockchain={this.props.blockchain}
                            blockchainIsLoaded={this.props.blockchainIsLoaded}
                            hashData={this.props.hashData}
                            label="Order Hash"
                        />
                    </div>
                    <div className="pt2">
                        <div className="center">
                            <LifeCycleRaisedButton
                                labelReady="Sign hash"
                                labelLoading="Signing..."
                                labelComplete="Hash signed!"
                                onClickAsyncFn={this.onSignClickedAsync.bind(this)}
                            />
                        </div>
                        {this.state.globalErrMsg !== '' &&
                            <Alert type={AlertTypes.ERROR} message={this.state.globalErrMsg} />
                        }
                    </div>
                </div>
                <Dialog
                    title="Order JSON"
                    titleStyle={{fontWeight: 100}}
                    modal={false}
                    open={this.state.signingState === SigningState.SIGNED}
                    onRequestClose={this.onCloseOrderJSONDialog.bind(this)}
                >
                    <OrderJSON
                        exchangeContractIfExists={exchangeContractIfExists}
                        orderExpiryTimestamp={this.props.orderExpiryTimestamp}
                        orderSignatureData={this.props.orderSignatureData}
                        orderTakerAddress={this.props.orderTakerAddress}
                        orderMakerAddress={this.props.userAddress}
                        orderSalt={this.props.orderSalt}
                        orderMakerFee={this.props.hashData.makerFee}
                        orderTakerFee={this.props.hashData.takerFee}
                        orderFeeRecipient={this.props.hashData.feeRecipientAddress}
                        networkId={this.props.networkId}
                        sideToAssetToken={this.props.sideToAssetToken}
                        tokenByAddress={this.props.tokenByAddress}
                    />
                </Dialog>
            </div>
        );
    }
    private onTokenAmountChange(token: Token, side: Side, isValid: boolean, amount?: BigNumber) {
        this.props.dispatcher.updateChosenAssetToken(side, {address: token.address, amount});
    }
    private onCloseOrderJSONDialog() {
        // Upon closing the order JSON dialog, we update the orderSalt stored in the Redux store
        // with a new value so that if a user signs the identical order again, the newly signed
        // orderHash will not collide with the previously generated orderHash.
        this.props.dispatcher.updateOrderSalt(ZeroEx.generatePseudoRandomSalt());
        this.setState({
            signingState: SigningState.UNSIGNED,
        });
    }
    private async onSignClickedAsync(): Promise<boolean> {
        if (this.props.blockchainErr !== '') {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            return false;
        }

        // Check if all required inputs were supplied
        const debitToken = this.props.sideToAssetToken[Side.deposit];
        const debitBalance = this.props.tokenStateByAddress[debitToken.address].balance;
        const debitAllowance = this.props.tokenStateByAddress[debitToken.address].allowance;
        const receiveAmount = this.props.sideToAssetToken[Side.receive].amount;
        if (!_.isUndefined(debitToken.amount) && !_.isUndefined(receiveAmount) &&
            debitToken.amount.gt(0) && receiveAmount.gt(0) &&
            this.props.userAddress !== '' &&
            debitBalance.gte(debitToken.amount) && debitAllowance.gte(debitToken.amount)) {
            const didSignSuccessfully = await this.signTransactionAsync();
            if (didSignSuccessfully) {
                this.setState({
                    globalErrMsg: '',
                    shouldShowIncompleteErrs: false,
                });
            }
            return didSignSuccessfully;
        } else {
            let globalErrMsg = 'You must fix the above errors in order to generate a valid order';
            if (this.props.userAddress === '') {
                globalErrMsg = 'You must enable wallet communication';
                this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            }
            this.setState({
                globalErrMsg,
                shouldShowIncompleteErrs: true,
            });
            return false;
        }
    }
    private async signTransactionAsync(): Promise<boolean> {
        this.setState({
            signingState: SigningState.SIGNING,
        });
        const exchangeContractAddr = this.props.blockchain.getExchangeContractAddressIfExists();
        if (_.isUndefined(exchangeContractAddr)) {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            this.setState({
                signingState: SigningState.UNSIGNED,
            });
            return false;
        }
        const hashData = this.props.hashData;

        const zeroExOrder: Order = {
            exchangeContractAddress: exchangeContractAddr,
            expirationUnixTimestampSec: hashData.orderExpiryTimestamp,
            feeRecipient: hashData.feeRecipientAddress,
            maker: hashData.orderMakerAddress,
            makerFee: hashData.makerFee,
            makerTokenAddress: hashData.depositTokenContractAddr,
            makerTokenAmount: hashData.depositAmount,
            salt: hashData.orderSalt,
            taker: hashData.orderTakerAddress,
            takerFee: hashData.takerFee,
            takerTokenAddress: hashData.receiveTokenContractAddr,
            takerTokenAmount: hashData.receiveAmount,
        };
        const orderHash = ZeroEx.getOrderHashHex(zeroExOrder);

        let globalErrMsg = '';
        try {
            const signatureData = await this.props.blockchain.signOrderHashAsync(orderHash);
            const order = utils.generateOrder(this.props.networkId, exchangeContractAddr, this.props.sideToAssetToken,
                                              hashData.orderExpiryTimestamp, this.props.orderTakerAddress,
                                              this.props.userAddress, hashData.makerFee, hashData.takerFee,
                                              hashData.feeRecipientAddress, signatureData, this.props.tokenByAddress,
                                              hashData.orderSalt);
            const validationResult = this.validator.validate(order, orderSchema);
            if (validationResult.errors.length > 0) {
                globalErrMsg = 'Order signing failed. Please refresh and try again';
                utils.consoleLog(`Unexpected error occured: Order validation failed:
                                  ${validationResult.errors}`);
            }
        } catch (err) {
            const errMsg = '' + err;
            if (utils.didUserDenyWeb3Request(errMsg)) {
                globalErrMsg = 'User denied sign request';
            } else {
                globalErrMsg = 'An unexpected error occured. Please try refreshing the page';
                utils.consoleLog(`Unexpected error occured: ${err}`);
                utils.consoleLog(err.stack);
                await errorReporter.reportAsync(err);
            }
        }
        this.setState({
            signingState: globalErrMsg === '' ? SigningState.SIGNED : SigningState.UNSIGNED,
            globalErrMsg,
        });
        return globalErrMsg === '';
    }
    private updateOrderAddress(address?: string): void {
        if (!_.isUndefined(address)) {
            this.props.dispatcher.updateOrderTakerAddress(address);
        }
    }
}
