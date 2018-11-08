import { assetDataUtils, generatePseudoRandomSalt, orderHashUtils } from '@0x/order-utils';
import { colors } from '@0x/react-shared';
import { Order as ZeroExOrder } from '@0x/types';
import { BigNumber, logUtils } from '@0x/utils';
import * as _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import Divider from 'material-ui/Divider';
import * as React from 'react';
import { Blockchain } from 'ts/blockchain';
import { ExpirationInput } from 'ts/components/inputs/expiration_input';
import { HashInput } from 'ts/components/inputs/hash_input';
import { IdenticonAddressInput } from 'ts/components/inputs/identicon_address_input';
import { TokenAmountInput } from 'ts/components/inputs/token_amount_input';
import { TokenInput } from 'ts/components/inputs/token_input';
import { OrderJSON } from 'ts/components/order_json';
import { Alert } from 'ts/components/ui/alert';
import { HelpTooltip } from 'ts/components/ui/help_tooltip';
import { LifeCycleRaisedButton } from 'ts/components/ui/lifecycle_raised_button';
import { SwapIcon } from 'ts/components/ui/swap_icon';
import { Dispatcher } from 'ts/redux/dispatcher';
import { portalOrderSchema } from 'ts/schemas/portal_order_schema';
import { validator } from 'ts/schemas/validator';
import {
    AlertTypes,
    BlockchainErrs,
    HashData,
    PortalOrder,
    Side,
    SideToAssetToken,
    Token,
    TokenByAddress,
} from 'ts/types';
import { analytics } from 'ts/utils/analytics';
import { constants } from 'ts/utils/constants';
import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';

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
    orderSignature: string;
    orderTakerAddress: string;
    orderSalt: BigNumber;
    sideToAssetToken: SideToAssetToken;
    tokenByAddress: TokenByAddress;
    lastForceTokenStateRefetch: number;
    isFullWidth?: boolean;
    shouldHideHeader?: boolean;
}

interface GenerateOrderFormState {
    globalErrMsg: string;
    shouldShowIncompleteErrs: boolean;
    signingState: SigningState;
}

export class GenerateOrderForm extends React.Component<GenerateOrderFormProps, GenerateOrderFormState> {
    public static defaultProps: Partial<GenerateOrderFormProps> = {
        isFullWidth: false,
        shouldHideHeader: false,
    };
    constructor(props: GenerateOrderFormProps) {
        super(props);
        this.state = {
            globalErrMsg: '',
            shouldShowIncompleteErrs: false,
            signingState: SigningState.UNSIGNED,
        };
    }
    public componentDidMount(): void {
        window.scrollTo(0, 0);
    }
    public render(): React.ReactNode {
        const dispatcher = this.props.dispatcher;
        const depositTokenAddress = this.props.sideToAssetToken[Side.Deposit].address;
        const depositToken = this.props.tokenByAddress[depositTokenAddress];
        const receiveTokenAddress = this.props.sideToAssetToken[Side.Receive].address;
        const receiveToken = this.props.tokenByAddress[receiveTokenAddress];
        const takerExplanation =
            'If a taker is specified, only they are<br> \
                                  allowed to fill this order. If no taker is<br> \
                                  specified, anyone is able to fill it.';
        const exchangeContractIfExists = this.props.blockchain.getExchangeContractAddressIfExists();
        const initialTakerAddress =
            this.props.orderTakerAddress === constants.NULL_ADDRESS ? '' : this.props.orderTakerAddress;
        const rootClassName = this.props.isFullWidth ? 'clearfix mb2' : 'clearfix mb2 lg-px4 md-px4 sm-px2';
        return (
            <div className={rootClassName}>
                {!this.props.shouldHideHeader && (
                    <div>
                        <h3>Generate an order</h3>
                        <Divider />
                    </div>
                )}
                <div className="mx-auto" style={{ maxWidth: 580 }}>
                    <div className="pt3">
                        <div className="mx-auto clearfix">
                            <div className="lg-col md-col lg-col-5 md-col-5 sm-col sm-col-5 sm-pb2">
                                <TokenInput
                                    userAddress={this.props.userAddress}
                                    blockchain={this.props.blockchain}
                                    blockchainErr={this.props.blockchainErr}
                                    dispatcher={this.props.dispatcher}
                                    label="Selling"
                                    side={Side.Deposit}
                                    networkId={this.props.networkId}
                                    assetToken={this.props.sideToAssetToken[Side.Deposit]}
                                    updateChosenAssetToken={dispatcher.updateChosenAssetToken.bind(dispatcher)}
                                    tokenByAddress={this.props.tokenByAddress}
                                />
                                <TokenAmountInput
                                    lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                                    blockchain={this.props.blockchain}
                                    userAddress={this.props.userAddress}
                                    networkId={this.props.networkId}
                                    label="Sell amount"
                                    token={depositToken}
                                    amount={this.props.sideToAssetToken[Side.Deposit].amount}
                                    onChange={this._onTokenAmountChange.bind(this, depositToken, Side.Deposit)}
                                    shouldShowIncompleteErrs={this.state.shouldShowIncompleteErrs}
                                    shouldCheckBalance={true}
                                    shouldCheckAllowance={true}
                                />
                            </div>
                            <div className="lg-col md-col lg-col-2 md-col-2 sm-col sm-col-2 xs-hide">
                                <div className="p1">
                                    <SwapIcon swapTokensFn={dispatcher.swapAssetTokenSymbols.bind(dispatcher)} />
                                </div>
                            </div>
                            <div className="lg-col md-col lg-col-5 md-col-5 sm-col sm-col-5 sm-pb2">
                                <TokenInput
                                    userAddress={this.props.userAddress}
                                    blockchain={this.props.blockchain}
                                    blockchainErr={this.props.blockchainErr}
                                    dispatcher={this.props.dispatcher}
                                    label="Buying"
                                    side={Side.Receive}
                                    networkId={this.props.networkId}
                                    assetToken={this.props.sideToAssetToken[Side.Receive]}
                                    updateChosenAssetToken={dispatcher.updateChosenAssetToken.bind(dispatcher)}
                                    tokenByAddress={this.props.tokenByAddress}
                                />
                                <TokenAmountInput
                                    lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                                    blockchain={this.props.blockchain}
                                    userAddress={this.props.userAddress}
                                    networkId={this.props.networkId}
                                    label="Receive amount"
                                    token={receiveToken}
                                    amount={this.props.sideToAssetToken[Side.Receive].amount}
                                    onChange={this._onTokenAmountChange.bind(this, receiveToken, Side.Receive)}
                                    shouldShowIncompleteErrs={this.state.shouldShowIncompleteErrs}
                                    shouldCheckBalance={false}
                                    shouldCheckAllowance={false}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="pt1 sm-pb2 lg-px4 md-px4">
                        <div className="lg-px3 md-px3">
                            <div style={{ fontSize: 12, color: colors.grey }}>Expiration</div>
                            <ExpirationInput
                                orderExpiryTimestamp={this.props.orderExpiryTimestamp}
                                updateOrderExpiry={dispatcher.updateOrderExpiry.bind(dispatcher)}
                            />
                        </div>
                    </div>
                    <div className="pt1 flex mx-auto">
                        <IdenticonAddressInput
                            label="Taker"
                            initialAddress={initialTakerAddress}
                            updateOrderAddress={this._updateOrderAddress.bind(this)}
                        />
                        <div className="pt3">
                            <div className="pl1">
                                <HelpTooltip explanation={takerExplanation} />
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
                                onClickAsyncFn={this._onSignClickedAsync.bind(this)}
                            />
                        </div>
                        {this.state.globalErrMsg !== '' && (
                            <Alert type={AlertTypes.ERROR} message={this.state.globalErrMsg} />
                        )}
                    </div>
                </div>
                <Dialog
                    title="Order JSON"
                    titleStyle={{ fontWeight: 100 }}
                    modal={false}
                    open={this.state.signingState === SigningState.SIGNED}
                    onRequestClose={this._onCloseOrderJSONDialog.bind(this)}
                >
                    <OrderJSON
                        exchangeContractIfExists={exchangeContractIfExists}
                        orderExpiryTimestamp={this.props.orderExpiryTimestamp}
                        orderSignature={this.props.orderSignature}
                        orderTakerAddress={this.props.orderTakerAddress}
                        orderMakerAddress={this.props.userAddress}
                        orderSalt={this.props.orderSalt}
                        orderMakerFee={this.props.hashData.makerFee}
                        orderTakerFee={this.props.hashData.takerFee}
                        orderFeeRecipient={this.props.hashData.feeRecipientAddress}
                        sideToAssetToken={this.props.sideToAssetToken}
                        tokenByAddress={this.props.tokenByAddress}
                    />
                </Dialog>
            </div>
        );
    }
    private _onTokenAmountChange(token: Token, side: Side, _isValid: boolean, amount?: BigNumber): void {
        this.props.dispatcher.updateChosenAssetToken(side, {
            address: token.address,
            amount,
        });
    }
    private _onCloseOrderJSONDialog(): void {
        // Upon closing the order JSON dialog, we update the orderSalt stored in the Redux store
        // with a new value so that if a user signs the identical order again, the newly signed
        // orderHash will not collide with the previously generated orderHash.
        this.props.dispatcher.updateOrderSalt(generatePseudoRandomSalt());
        this.setState({
            signingState: SigningState.UNSIGNED,
        });
    }
    private async _onSignClickedAsync(): Promise<boolean> {
        if (this.props.blockchainErr !== BlockchainErrs.NoError) {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            return false;
        }

        // Check if all required inputs were supplied
        const debitToken = this.props.sideToAssetToken[Side.Deposit];
        const userAddressIfExists = _.isEmpty(this.props.userAddress) ? undefined : this.props.userAddress;
        const [debitBalance, debitAllowance] = await this.props.blockchain.getTokenBalanceAndAllowanceAsync(
            userAddressIfExists,
            debitToken.address,
        );
        const receiveToken = this.props.sideToAssetToken[Side.Receive];
        const receiveAmount = receiveToken.amount;
        if (
            !_.isUndefined(debitToken.amount) &&
            !_.isUndefined(receiveAmount) &&
            debitToken.amount.gt(0) &&
            receiveAmount.gt(0) &&
            this.props.userAddress !== '' &&
            debitBalance.gte(debitToken.amount) &&
            debitAllowance.gte(debitToken.amount)
        ) {
            const signedOrder = await this._signTransactionAsync();
            const doesSignedOrderExist = !_.isUndefined(signedOrder);
            if (doesSignedOrderExist) {
                analytics.trackOrderEvent('Sign Order Success', signedOrder);
                this.setState({
                    globalErrMsg: '',
                    shouldShowIncompleteErrs: false,
                });
            }
            return doesSignedOrderExist;
        } else {
            let globalErrMsg = 'You must fix the above errors in order to generate a valid order';
            if (this.props.userAddress === '') {
                globalErrMsg = 'You must enable wallet communication';
                this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            }
            analytics.track('Sign Order Failure', {
                makerTokenAmount: debitToken.amount.toString(),
                makerToken: this.props.tokenByAddress[debitToken.address].symbol,
                takerTokenAmount: receiveToken.amount.toString(),
                takerToken: this.props.tokenByAddress[receiveToken.address].symbol,
            });
            this.setState({
                globalErrMsg,
                shouldShowIncompleteErrs: true,
            });
            return false;
        }
    }
    private async _signTransactionAsync(): Promise<PortalOrder | undefined> {
        this.setState({
            signingState: SigningState.SIGNING,
        });
        const exchangeAddress = this.props.blockchain.getExchangeContractAddressIfExists();
        if (_.isUndefined(exchangeAddress)) {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            this.setState({
                signingState: SigningState.UNSIGNED,
            });
            return undefined;
        }
        const hashData = this.props.hashData;

        const makerAssetData = assetDataUtils.encodeERC20AssetData(hashData.depositTokenContractAddr);
        const takerAssetData = assetDataUtils.encodeERC20AssetData(hashData.receiveTokenContractAddr);
        const zeroExOrder: ZeroExOrder = {
            senderAddress: constants.NULL_ADDRESS,
            exchangeAddress,
            expirationTimeSeconds: hashData.orderExpiryTimestamp,
            feeRecipientAddress: hashData.feeRecipientAddress,
            makerAddress: hashData.orderMakerAddress,
            makerFee: hashData.makerFee,
            makerAssetData,
            makerAssetAmount: hashData.depositAmount,
            salt: hashData.orderSalt,
            takerAddress: hashData.orderTakerAddress,
            takerFee: hashData.takerFee,
            takerAssetData,
            takerAssetAmount: hashData.receiveAmount,
        };
        const orderHash = orderHashUtils.getOrderHashHex(zeroExOrder);

        let globalErrMsg = '';
        let order;
        try {
            const signature = await this.props.blockchain.signOrderHashAsync(orderHash);
            order = utils.generateOrder(
                exchangeAddress,
                this.props.sideToAssetToken,
                hashData.orderExpiryTimestamp,
                this.props.orderTakerAddress,
                this.props.userAddress,
                hashData.makerFee,
                hashData.takerFee,
                hashData.feeRecipientAddress,
                signature,
                this.props.tokenByAddress,
                hashData.orderSalt,
            );
            const validationResult = validator.validate(order, portalOrderSchema);
            if (validationResult.errors.length > 0) {
                globalErrMsg = 'Order signing failed. Please refresh and try again';
                logUtils.log(`Unexpected error occured: Order validation failed:
                                  ${validationResult.errors}`);
            }
        } catch (err) {
            const errMsg = `${err}`;
            if (utils.didUserDenyWeb3Request(errMsg)) {
                globalErrMsg = 'User denied sign request';
            } else {
                globalErrMsg = 'An unexpected error occured. Please try refreshing the page';
                logUtils.log(`Unexpected error occured: ${err}`);
                logUtils.log(err.stack);
                errorReporter.report(err);
            }
        }
        this.setState({
            signingState: globalErrMsg === '' ? SigningState.SIGNED : SigningState.UNSIGNED,
            globalErrMsg,
        });
        return order;
    }
    private _updateOrderAddress(address?: string): void {
        if (!_.isUndefined(address)) {
            const normalizedAddress = _.isEmpty(address) ? constants.NULL_ADDRESS : address;
            this.props.dispatcher.updateOrderTakerAddress(normalizedAddress);
        }
    }
}
