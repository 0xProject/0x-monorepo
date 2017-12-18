import {Order as ZeroExOrder, ZeroEx} from '0x.js';
import * as accounting from 'accounting';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import {Card, CardHeader, CardText} from 'material-ui/Card';
import Divider from 'material-ui/Divider';
import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';
import {Link} from 'react-router-dom';
import {Blockchain} from 'ts/blockchain';
import {TrackTokenConfirmationDialog} from 'ts/components/dialogs/track_token_confirmation_dialog';
import {FillOrderJSON} from 'ts/components/fill_order_json';
import {FillWarningDialog} from 'ts/components/fill_warning_dialog';
import {TokenAmountInput} from 'ts/components/inputs/token_amount_input';
import {Alert} from 'ts/components/ui/alert';
import {EthereumAddress} from 'ts/components/ui/ethereum_address';
import {Identicon} from 'ts/components/ui/identicon';
import {VisualOrder} from 'ts/components/visual_order';
import {Dispatcher} from 'ts/redux/dispatcher';
import {orderSchema} from 'ts/schemas/order_schema';
import {SchemaValidator} from 'ts/schemas/validator';
import {
    AlertTypes,
    BlockchainErrs,
    Order,
    Token,
    TokenByAddress,
    TokenStateByAddress,
    WebsitePaths,
} from 'ts/types';
import {colors} from 'ts/utils/colors';
import {constants} from 'ts/utils/constants';
import {errorReporter} from 'ts/utils/error_reporter';
import {utils} from 'ts/utils/utils';

interface FillOrderProps {
    blockchain: Blockchain;
    blockchainErr: BlockchainErrs;
    orderFillAmount: BigNumber;
    isOrderInUrl: boolean;
    networkId: number;
    userAddress: string;
    tokenByAddress: TokenByAddress;
    tokenStateByAddress: TokenStateByAddress;
    initialOrder: Order;
    dispatcher: Dispatcher;
}

interface FillOrderState {
    didOrderValidationRun: boolean;
    areAllInvolvedTokensTracked: boolean;
    globalErrMsg: string;
    orderJSON: string;
    orderJSONErrMsg: string;
    parsedOrder: Order;
    didFillOrderSucceed: boolean;
    didCancelOrderSucceed: boolean;
    unavailableTakerAmount: BigNumber;
    isMakerTokenAddressInRegistry: boolean;
    isTakerTokenAddressInRegistry: boolean;
    isFillWarningDialogOpen: boolean;
    isFilling: boolean;
    isCancelling: boolean;
    isConfirmingTokenTracking: boolean;
    tokensToTrack: Token[];
}

export class FillOrder extends React.Component<FillOrderProps, FillOrderState> {
    private validator: SchemaValidator;
    constructor(props: FillOrderProps) {
        super(props);
        this.state = {
            globalErrMsg: '',
            didOrderValidationRun: false,
            areAllInvolvedTokensTracked: false,
            didFillOrderSucceed: false,
            didCancelOrderSucceed: false,
            orderJSON: _.isUndefined(this.props.initialOrder) ? '' : JSON.stringify(this.props.initialOrder),
            orderJSONErrMsg: '',
            parsedOrder: this.props.initialOrder,
            unavailableTakerAmount: new BigNumber(0),
            isMakerTokenAddressInRegistry: false,
            isTakerTokenAddressInRegistry: false,
            isFillWarningDialogOpen: false,
            isFilling: false,
            isCancelling: false,
            isConfirmingTokenTracking: false,
            tokensToTrack: [],
        };
        this.validator = new SchemaValidator();
    }
    public componentWillMount() {
        if (!_.isEmpty(this.state.orderJSON)) {
            // tslint:disable-next-line:no-floating-promises
            this.validateFillOrderFireAndForgetAsync(this.state.orderJSON);
        }
    }
    public componentDidMount() {
        window.scrollTo(0, 0);
    }
    public render() {
        return (
            <div className="clearfix lg-px4 md-px4 sm-px2" style={{minHeight: 600}}>
                <h3>Fill an order</h3>
                <Divider />
                <div>
                    {!this.props.isOrderInUrl &&
                        <div>
                            <div className="pt2 pb2">
                                Paste an order JSON snippet below to begin
                            </div>
                            <div className="pb2">Order JSON</div>
                            <FillOrderJSON
                                blockchain={this.props.blockchain}
                                tokenByAddress={this.props.tokenByAddress}
                                networkId={this.props.networkId}
                                orderJSON={this.state.orderJSON}
                                onFillOrderJSONChanged={this.onFillOrderJSONChanged.bind(this)}
                            />
                            {this.renderOrderJsonNotices()}
                        </div>
                    }
                    <div>
                        {!_.isUndefined(this.state.parsedOrder) && this.state.didOrderValidationRun
                         && this.state.areAllInvolvedTokensTracked &&
                             this.renderVisualOrder()
                        }
                    </div>
                    {this.props.isOrderInUrl &&
                        <div className="pt2">
                            <Card style={{boxShadow: 'none', backgroundColor: 'none', border: '1px solid #eceaea'}}>
                                <CardHeader
                                    title="Order JSON"
                                    actAsExpander={true}
                                    showExpandableButton={true}
                                />
                                <CardText expandable={true}>
                                    <FillOrderJSON
                                        blockchain={this.props.blockchain}
                                        tokenByAddress={this.props.tokenByAddress}
                                        networkId={this.props.networkId}
                                        orderJSON={this.state.orderJSON}
                                        onFillOrderJSONChanged={this.onFillOrderJSONChanged.bind(this)}
                                    />
                                </CardText>
                            </Card>
                            {this.renderOrderJsonNotices()}
                        </div>
                    }
                </div>
                <FillWarningDialog
                    isOpen={this.state.isFillWarningDialogOpen}
                    onToggleDialog={this.onFillWarningClosed.bind(this)}
                />
                <TrackTokenConfirmationDialog
                    userAddress={this.props.userAddress}
                    networkId={this.props.networkId}
                    blockchain={this.props.blockchain}
                    tokenByAddress={this.props.tokenByAddress}
                    dispatcher={this.props.dispatcher}
                    tokens={this.state.tokensToTrack}
                    isOpen={this.state.isConfirmingTokenTracking}
                    onToggleDialog={this.onToggleTrackConfirmDialog.bind(this)}
                />
            </div>
        );
    }
    private renderOrderJsonNotices() {
        return (
            <div>
                {!_.isUndefined(this.props.initialOrder) && !this.state.didOrderValidationRun &&
                    <div className="pt2">
                        <span className="pr1">
                            <i className="zmdi zmdi-spinner zmdi-hc-spin" />
                        </span>
                        <span>Validating order...</span>
                    </div>
                }
                {!_.isEmpty(this.state.orderJSONErrMsg) &&
                    <Alert type={AlertTypes.ERROR} message={this.state.orderJSONErrMsg} />
                }
            </div>
        );
    }
    private renderVisualOrder() {
        const takerTokenAddress = this.state.parsedOrder.taker.token.address;
        const takerToken = this.props.tokenByAddress[takerTokenAddress];
        const orderTakerAmount = new BigNumber(this.state.parsedOrder.taker.amount);
        const orderMakerAmount = new BigNumber(this.state.parsedOrder.maker.amount);
        const takerAssetToken = {
            amount: orderTakerAmount.minus(this.state.unavailableTakerAmount),
            symbol: takerToken.symbol,
        };
        const fillToken = this.props.tokenByAddress[takerToken.address];
        const fillTokenState = this.props.tokenStateByAddress[takerToken.address];
        const makerTokenAddress = this.state.parsedOrder.maker.token.address;
        const makerToken = this.props.tokenByAddress[makerTokenAddress];
        const makerAssetToken = {
            amount: orderMakerAmount.times(takerAssetToken.amount).div(orderTakerAmount),
            symbol: makerToken.symbol,
        };
        const fillAssetToken = {
            amount: this.props.orderFillAmount,
            symbol: takerToken.symbol,
        };
        const orderTaker = !_.isEmpty(this.state.parsedOrder.taker.address) ? this.state.parsedOrder.taker.address :
                           this.props.userAddress;
        const parsedOrderExpiration = new BigNumber(this.state.parsedOrder.expiration);
        const exchangeRate = orderMakerAmount.div(orderTakerAmount);

        let orderReceiveAmount = 0;
        if (!_.isUndefined(this.props.orderFillAmount)) {
            const orderReceiveAmountBigNumber = exchangeRate.mul(this.props.orderFillAmount);
            orderReceiveAmount = this.formatCurrencyAmount(orderReceiveAmountBigNumber, makerToken.decimals);
        }
        const isUserMaker = !_.isUndefined(this.state.parsedOrder) &&
                          this.state.parsedOrder.maker.address === this.props.userAddress;
        const expiryDate = utils.convertToReadableDateTimeFromUnixTimestamp(parsedOrderExpiration);
        return (
            <div className="pt3 pb1">
                <div className="clearfix pb2" style={{width: '100%'}}>
                    <div className="inline left">Order details</div>
                    <div className="inline right" style={{minWidth: 208}}>
                        <div className="col col-4 pl2" style={{color: colors.grey}}>
                            Maker:
                        </div>
                        <div className="col col-2 pr1">
                            <Identicon
                                address={this.state.parsedOrder.maker.address}
                                diameter={23}
                            />
                        </div>
                        <div className="col col-6">
                            <EthereumAddress
                                address={this.state.parsedOrder.maker.address}
                                networkId={this.props.networkId}
                            />
                        </div>
                    </div>
                </div>
                <div className="lg-px4 md-px4 sm-px0">
                    <div className="lg-px4 md-px4 sm-px1 pt1">
                        <VisualOrder
                            orderTakerAddress={orderTaker}
                            orderMakerAddress={this.state.parsedOrder.maker.address}
                            makerAssetToken={makerAssetToken}
                            takerAssetToken={takerAssetToken}
                            tokenByAddress={this.props.tokenByAddress}
                            makerToken={makerToken}
                            takerToken={takerToken}
                            networkId={this.props.networkId}
                            isMakerTokenAddressInRegistry={this.state.isMakerTokenAddressInRegistry}
                            isTakerTokenAddressInRegistry={this.state.isTakerTokenAddressInRegistry}
                        />
                        <div className="center pt3 pb2">
                            Expires: {expiryDate} UTC
                        </div>
                    </div>
                </div>
                {!isUserMaker &&
                    <div className="clearfix mx-auto" style={{width: 315, height: 108}}>
                       <div className="col col-7" style={{maxWidth: 235}}>
                           <TokenAmountInput
                               label="Fill amount"
                               onChange={this.onFillAmountChange.bind(this)}
                               shouldShowIncompleteErrs={false}
                               token={fillToken}
                               tokenState={fillTokenState}
                               amount={fillAssetToken.amount}
                               shouldCheckBalance={true}
                               shouldCheckAllowance={true}
                           />
                       </div>
                       <div
                           className="col col-5 pl1"
                           style={{color: colors.grey400, paddingTop: 39}}
                       >
                           = {accounting.formatNumber(orderReceiveAmount, 6)} {makerToken.symbol}
                       </div>
                    </div>
                }
                <div>
                    {isUserMaker ?
                        <div>
                            <RaisedButton
                                style={{width: '100%'}}
                                disabled={this.state.isCancelling}
                                label={this.state.isCancelling ? 'Cancelling order...' : 'Cancel order'}
                                onClick={this.onCancelOrderClickFireAndForgetAsync.bind(this)}
                            />
                            {this.state.didCancelOrderSucceed &&
                                <Alert
                                    type={AlertTypes.SUCCESS}
                                    message={this.renderCancelSuccessMsg()}
                                />
                            }
                        </div> :
                        <div>
                            <RaisedButton
                                style={{width: '100%'}}
                                disabled={this.state.isFilling}
                                label={this.state.isFilling ? 'Filling order...' : 'Fill order'}
                                onClick={this.onFillOrderClick.bind(this)}
                            />
                            {!_.isEmpty(this.state.globalErrMsg) &&
                                <Alert type={AlertTypes.ERROR} message={this.state.globalErrMsg} />
                            }
                            {this.state.didFillOrderSucceed &&
                                <Alert
                                    type={AlertTypes.SUCCESS}
                                    message={this.renderFillSuccessMsg()}
                                />
                            }
                        </div>
                    }
                </div>
            </div>
        );
    }
    private renderFillSuccessMsg() {
        return (
            <div>
                Order successfully filled. See the trade details in your{' '}
                <Link
                    to={`${WebsitePaths.Portal}/trades`}
                    style={{color: 'white'}}
                >
                    trade history
                </Link>
            </div>
        );
    }
    private renderCancelSuccessMsg() {
        return (
            <div>
                Order successfully cancelled.
            </div>
        );
    }
    private onFillOrderClick() {
        if (!this.state.isMakerTokenAddressInRegistry || !this.state.isTakerTokenAddressInRegistry) {
            this.setState({
                isFillWarningDialogOpen: true,
            });
        } else {
            // tslint:disable-next-line:no-floating-promises
            this.onFillOrderClickFireAndForgetAsync();
        }
    }
    private onFillWarningClosed(didUserCancel: boolean) {
        this.setState({
            isFillWarningDialogOpen: false,
        });
        if (!didUserCancel) {
            // tslint:disable-next-line:no-floating-promises
            this.onFillOrderClickFireAndForgetAsync();
        }
    }
    private onFillAmountChange(isValid: boolean, amount?: BigNumber) {
        this.props.dispatcher.updateOrderFillAmount(amount);
    }
    private onFillOrderJSONChanged(event: any) {
        const orderJSON = event.target.value;
        this.setState({
            didOrderValidationRun: _.isEmpty(orderJSON) && _.isEmpty(this.state.orderJSONErrMsg),
            didFillOrderSucceed: false,
        });
        // tslint:disable-next-line:no-floating-promises
        this.validateFillOrderFireAndForgetAsync(orderJSON);
    }
    private async checkForUntrackedTokensAndAskToAdd() {
        if (!_.isEmpty(this.state.orderJSONErrMsg)) {
            return;
        }

        const makerTokenIfExists = this.props.tokenByAddress[this.state.parsedOrder.maker.token.address];
        const takerTokenIfExists = this.props.tokenByAddress[this.state.parsedOrder.taker.token.address];

        const tokensToTrack = [];
        const isUnseenMakerToken = _.isUndefined(makerTokenIfExists);
        const isMakerTokenTracked = !_.isUndefined(makerTokenIfExists) && makerTokenIfExists.isTracked;
        if (isUnseenMakerToken) {
            tokensToTrack.push(_.assign({}, this.state.parsedOrder.maker.token, {
                iconUrl: undefined,
                isTracked: false,
                isRegistered: false,
            }));
        } else if (!isMakerTokenTracked) {
            tokensToTrack.push(makerTokenIfExists);
        }
        const isUnseenTakerToken = _.isUndefined(takerTokenIfExists);
        const isTakerTokenTracked = !_.isUndefined(takerTokenIfExists) && takerTokenIfExists.isTracked;
        if (isUnseenTakerToken) {
            tokensToTrack.push(_.assign({}, this.state.parsedOrder.taker.token, {
                iconUrl: undefined,
                isTracked: false,
                isRegistered: false,
            }));
        } else if (!isTakerTokenTracked) {
            tokensToTrack.push(takerTokenIfExists);
        }
        if (!_.isEmpty(tokensToTrack)) {
            this.setState({
                isConfirmingTokenTracking: true,
                tokensToTrack,
            });
        } else {
            this.setState({
                areAllInvolvedTokensTracked: true,
            });
        }
    }
    private async validateFillOrderFireAndForgetAsync(orderJSON: string) {
        let orderJSONErrMsg = '';
        let parsedOrder: Order;
        try {
            const order = JSON.parse(orderJSON);
            const validationResult = this.validator.validate(order, orderSchema);
            if (validationResult.errors.length > 0) {
                orderJSONErrMsg = 'Submitted order JSON is not a valid order';
                utils.consoleLog(`Unexpected order JSON validation error: ${validationResult.errors.join(', ')}`);
                return;
            }
            parsedOrder = order;

            const exchangeContractAddr = this.props.blockchain.getExchangeContractAddressIfExists();
            const makerAmount = new BigNumber(parsedOrder.maker.amount);
            const takerAmount = new BigNumber(parsedOrder.taker.amount);
            const expiration = new BigNumber(parsedOrder.expiration);
            const salt = new BigNumber(parsedOrder.salt);
            const parsedMakerFee = new BigNumber(parsedOrder.maker.feeAmount);
            const parsedTakerFee = new BigNumber(parsedOrder.taker.feeAmount);

            const zeroExOrder: ZeroExOrder = {
                exchangeContractAddress: parsedOrder.exchangeContract,
                expirationUnixTimestampSec: expiration,
                feeRecipient: parsedOrder.feeRecipient,
                maker: parsedOrder.maker.address,
                makerFee: parsedMakerFee,
                makerTokenAddress: parsedOrder.maker.token.address,
                makerTokenAmount: makerAmount,
                salt,
                taker: _.isEmpty(parsedOrder.taker.address) ? constants.NULL_ADDRESS : parsedOrder.taker.address,
                takerFee: parsedTakerFee,
                takerTokenAddress: parsedOrder.taker.token.address,
                takerTokenAmount: takerAmount,
            };
            const orderHash = ZeroEx.getOrderHashHex(zeroExOrder);

            const signature = parsedOrder.signature;
            const isValidSignature = ZeroEx.isValidSignature(signature.hash, signature, parsedOrder.maker.address);
            if (this.props.networkId !== parsedOrder.networkId) {
                orderJSONErrMsg = `This order was made on another Ethereum network
                                   (id: ${parsedOrder.networkId}). Connect to this network to fill.`;
                parsedOrder = undefined;
            } else if (exchangeContractAddr !== parsedOrder.exchangeContract) {
                orderJSONErrMsg = 'This order was made using a deprecated 0x Exchange contract.';
                parsedOrder = undefined;
            } else if (orderHash !== signature.hash) {
                orderJSONErrMsg = 'Order hash does not match supplied plaintext values';
                parsedOrder = undefined;
            } else if (!isValidSignature) {
                orderJSONErrMsg = 'Order signature is invalid';
                parsedOrder = undefined;
            } else {
                // Update user supplied order cache so that if they navigate away from fill view
                // e.g to set a token allowance, when they come back, the fill order persists
                this.props.dispatcher.updateUserSuppliedOrderCache(parsedOrder);
            }
        } catch (err) {
            utils.consoleLog(`Validate order err: ${err}`);
            if (!_.isEmpty(orderJSON)) {
                orderJSONErrMsg = 'Submitted order JSON is not valid JSON';
            }
            this.setState({
                didOrderValidationRun: true,
                orderJSON,
                orderJSONErrMsg,
                parsedOrder,
            });
            return;
        }

        let unavailableTakerAmount = new BigNumber(0);
        if (!_.isEmpty(orderJSONErrMsg)) {
            // Clear cache entry if user updates orderJSON to invalid entry
            this.props.dispatcher.updateUserSuppliedOrderCache(undefined);
        } else {
            const orderHash = parsedOrder.signature.hash;
            unavailableTakerAmount = await this.props.blockchain.getUnavailableTakerAmountAsync(orderHash);
            const isMakerTokenAddressInRegistry = await this.props.blockchain.isAddressInTokenRegistryAsync(
                parsedOrder.maker.token.address,
            );
            const isTakerTokenAddressInRegistry = await this.props.blockchain.isAddressInTokenRegistryAsync(
                parsedOrder.taker.token.address,
            );
            this.setState({
                isMakerTokenAddressInRegistry,
                isTakerTokenAddressInRegistry,
            });
        }

        this.setState({
            didOrderValidationRun: true,
            orderJSON,
            orderJSONErrMsg,
            parsedOrder,
            unavailableTakerAmount,
        });

        await this.checkForUntrackedTokensAndAskToAdd();
    }
    private async onFillOrderClickFireAndForgetAsync(): Promise<void> {
        if (!_.isEmpty(this.props.blockchainErr) || _.isEmpty(this.props.userAddress)) {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            return;
        }

        this.setState({
            isFilling: true,
            didFillOrderSucceed: false,
        });

        const parsedOrder = this.state.parsedOrder;
        const takerFillAmount = this.props.orderFillAmount;

        if (_.isUndefined(this.props.userAddress)) {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            this.setState({
                isFilling: false,
            });
            return;
        }
        let globalErrMsg = '';

        if (_.isUndefined(takerFillAmount)) {
            globalErrMsg = 'You must specify a fill amount';
        }

        const signedOrder = this.props.blockchain.portalOrderToSignedOrder(
            parsedOrder.maker.address,
            parsedOrder.taker.address,
            parsedOrder.maker.token.address,
            parsedOrder.taker.token.address,
            new BigNumber(parsedOrder.maker.amount),
            new BigNumber(parsedOrder.taker.amount),
            new BigNumber(parsedOrder.maker.feeAmount),
            new BigNumber(parsedOrder.taker.feeAmount),
            new BigNumber(this.state.parsedOrder.expiration),
            parsedOrder.feeRecipient,
            parsedOrder.signature,
            new BigNumber(parsedOrder.salt),
        );
        if (_.isEmpty(globalErrMsg)) {
            try {
                await this.props.blockchain.validateFillOrderThrowIfInvalidAsync(
                    signedOrder, takerFillAmount, this.props.userAddress);
            } catch (err) {
                globalErrMsg = utils.zeroExErrToHumanReadableErrMsg(
                    err.message, parsedOrder.taker.address,
                );
            }
        }
        if (!_.isEmpty(globalErrMsg)) {
            this.setState({
                isFilling: false,
                globalErrMsg,
            });
            return;
        }
        try {
            const orderFilledAmount: BigNumber = await this.props.blockchain.fillOrderAsync(
                signedOrder, this.props.orderFillAmount,
            );
            // After fill completes, let's update the token balances
            const makerToken = this.props.tokenByAddress[parsedOrder.maker.token.address];
            const takerToken = this.props.tokenByAddress[parsedOrder.taker.token.address];
            const tokens = [makerToken, takerToken];
            await this.props.blockchain.updateTokenBalancesAndAllowancesAsync(tokens);
            this.setState({
                isFilling: false,
                didFillOrderSucceed: true,
                globalErrMsg: '',
                unavailableTakerAmount: this.state.unavailableTakerAmount.plus(orderFilledAmount),
            });
            return;
        } catch (err) {
            this.setState({
                isFilling: false,
            });
            const errMsg = `${err}`;
            if (_.includes(errMsg, 'User denied transaction signature')) {
                return;
            }
            globalErrMsg = 'Failed to fill order, please refresh and try again';
            utils.consoleLog(`${err}`);
            await errorReporter.reportAsync(err);
            this.setState({
                globalErrMsg,
            });
            return;
        }
    }
    private async onCancelOrderClickFireAndForgetAsync(): Promise<void> {
        if (!_.isEmpty(this.props.blockchainErr) || _.isEmpty(this.props.userAddress)) {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            return;
        }

        this.setState({
            isCancelling: true,
            didCancelOrderSucceed: false,
        });

        const parsedOrder = this.state.parsedOrder;
        const orderHash = parsedOrder.signature.hash;
        const takerAddress = this.props.userAddress;

        if (_.isUndefined(takerAddress)) {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            this.setState({
                isFilling: false,
            });
            return;
        }
        let globalErrMsg = '';

        const takerTokenAmount = new BigNumber(parsedOrder.taker.amount);

        const signedOrder = this.props.blockchain.portalOrderToSignedOrder(
            parsedOrder.maker.address,
            parsedOrder.taker.address,
            parsedOrder.maker.token.address,
            parsedOrder.taker.token.address,
            new BigNumber(parsedOrder.maker.amount),
            takerTokenAmount,
            new BigNumber(parsedOrder.maker.feeAmount),
            new BigNumber(parsedOrder.taker.feeAmount),
            new BigNumber(this.state.parsedOrder.expiration),
            parsedOrder.feeRecipient,
            parsedOrder.signature,
            new BigNumber(parsedOrder.salt),
        );
        const unavailableTakerAmount = await this.props.blockchain.getUnavailableTakerAmountAsync(orderHash);
        const availableTakerTokenAmount = takerTokenAmount.minus(unavailableTakerAmount);
        try {
            await this.props.blockchain.validateCancelOrderThrowIfInvalidAsync(
                signedOrder, availableTakerTokenAmount);
        } catch (err) {
            globalErrMsg = utils.zeroExErrToHumanReadableErrMsg(err.message, parsedOrder.taker.address);
        }
        if (!_.isEmpty(globalErrMsg)) {
            this.setState({
                isCancelling: false,
                globalErrMsg,
            });
            return;
        }
        try {
            await this.props.blockchain.cancelOrderAsync(
                signedOrder, availableTakerTokenAmount,
            );
            this.setState({
                isCancelling: false,
                didCancelOrderSucceed: true,
                globalErrMsg: '',
                unavailableTakerAmount: takerTokenAmount,
            });
            return;
        } catch (err) {
            this.setState({
                isCancelling: false,
            });
            const errMsg = `${err}`;
            if (_.includes(errMsg, 'User denied transaction signature')) {
                return;
            }
            globalErrMsg = 'Failed to cancel order, please refresh and try again';
            utils.consoleLog(`${err}`);
            await errorReporter.reportAsync(err);
            this.setState({
                globalErrMsg,
            });
            return;
        }
    }
    private formatCurrencyAmount(amount: BigNumber, decimals: number): number {
        const unitAmount = ZeroEx.toUnitAmount(amount, decimals);
        const roundedUnitAmount = Math.round(unitAmount.toNumber() * 100000) / 100000;
        return roundedUnitAmount;
    }
    private onToggleTrackConfirmDialog(didConfirmTokenTracking: boolean) {
        if (!didConfirmTokenTracking) {
            this.setState({
                orderJSON: '',
                orderJSONErrMsg: '',
                parsedOrder: undefined,
            });
        } else {
            this.setState({
                areAllInvolvedTokensTracked: true,
            });
        }
        this.setState({
            isConfirmingTokenTracking: !this.state.isConfirmingTokenTracking,
            tokensToTrack: [],
        });
    }
} // tslint:disable:max-file-line-count
