import { Order as ZeroExOrder, ZeroEx } from '0x.js';
import { colors, constants as sharedConstants } from '@0xproject/react-shared';
import { BigNumber, logUtils } from '@0xproject/utils';
import * as accounting from 'accounting';
import * as _ from 'lodash';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import Divider from 'material-ui/Divider';
import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Blockchain } from 'ts/blockchain';
import { TrackTokenConfirmationDialog } from 'ts/components/dialogs/track_token_confirmation_dialog';
import { FillOrderJSON } from 'ts/components/fill_order_json';
import { FillWarningDialog } from 'ts/components/fill_warning_dialog';
import { TokenAmountInput } from 'ts/components/inputs/token_amount_input';
import { Alert } from 'ts/components/ui/alert';
import { EthereumAddress } from 'ts/components/ui/ethereum_address';
import { Identicon } from 'ts/components/ui/identicon';
import { VisualOrder } from 'ts/components/visual_order';
import { Dispatcher } from 'ts/redux/dispatcher';
import { portalOrderSchema } from 'ts/schemas/portal_order_schema';
import { validator } from 'ts/schemas/validator';
import { AlertTypes, BlockchainErrs, Order, Token, TokenByAddress, WebsitePaths } from 'ts/types';
import { analytics } from 'ts/utils/analytics';
import { constants } from 'ts/utils/constants';
import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';

interface FillOrderProps {
    blockchain: Blockchain;
    blockchainErr: BlockchainErrs;
    orderFillAmount: BigNumber;
    isOrderInUrl: boolean;
    networkId: number;
    userAddress: string;
    tokenByAddress: TokenByAddress;
    initialOrder: Order;
    dispatcher: Dispatcher;
    lastForceTokenStateRefetch: number;
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
    private _isUnmounted: boolean;
    constructor(props: FillOrderProps) {
        super(props);
        this._isUnmounted = false;
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
    }
    public componentWillMount() {
        if (!_.isEmpty(this.state.orderJSON)) {
            // tslint:disable-next-line:no-floating-promises
            this._validateFillOrderFireAndForgetAsync(this.state.orderJSON);
        }
    }
    public componentDidMount() {
        window.scrollTo(0, 0);
    }
    public componentWillUnmount() {
        this._isUnmounted = true;
    }
    public render() {
        return (
            <div className="clearfix lg-px4 md-px4 sm-px2" style={{ minHeight: 600 }}>
                <h3>Fill an order</h3>
                <Divider />
                <div>
                    {!this.props.isOrderInUrl && (
                        <div>
                            <div className="pt2 pb2">Paste an order JSON snippet below to begin</div>
                            <div className="pb2">Order JSON</div>
                            <FillOrderJSON
                                blockchain={this.props.blockchain}
                                tokenByAddress={this.props.tokenByAddress}
                                orderJSON={this.state.orderJSON}
                                onFillOrderJSONChanged={this._onFillOrderJSONChanged.bind(this)}
                            />
                            {this._renderOrderJsonNotices()}
                        </div>
                    )}
                    <div>
                        {!_.isUndefined(this.state.parsedOrder) &&
                            this.state.didOrderValidationRun &&
                            this.state.areAllInvolvedTokensTracked &&
                            this._renderVisualOrder()}
                    </div>
                    {this.props.isOrderInUrl && (
                        <div className="pt2">
                            <Card
                                style={{
                                    boxShadow: 'none',
                                    backgroundColor: 'none',
                                    border: '1px solid #eceaea',
                                }}
                            >
                                <CardHeader title="Order JSON" actAsExpander={true} showExpandableButton={true} />
                                <CardText expandable={true}>
                                    <FillOrderJSON
                                        blockchain={this.props.blockchain}
                                        tokenByAddress={this.props.tokenByAddress}
                                        orderJSON={this.state.orderJSON}
                                        onFillOrderJSONChanged={this._onFillOrderJSONChanged.bind(this)}
                                    />
                                </CardText>
                            </Card>
                            {this._renderOrderJsonNotices()}
                        </div>
                    )}
                </div>
                <FillWarningDialog
                    isOpen={this.state.isFillWarningDialogOpen}
                    onToggleDialog={this._onFillWarningClosed.bind(this)}
                />
                <TrackTokenConfirmationDialog
                    userAddress={this.props.userAddress}
                    networkId={this.props.networkId}
                    blockchain={this.props.blockchain}
                    tokenByAddress={this.props.tokenByAddress}
                    dispatcher={this.props.dispatcher}
                    tokens={this.state.tokensToTrack}
                    isOpen={this.state.isConfirmingTokenTracking}
                    onToggleDialog={this._onToggleTrackConfirmDialog.bind(this)}
                />
            </div>
        );
    }
    private _renderOrderJsonNotices() {
        return (
            <div>
                {!_.isUndefined(this.props.initialOrder) &&
                    !this.state.didOrderValidationRun && (
                        <div className="pt2">
                            <span className="pr1">
                                <i className="zmdi zmdi-spinner zmdi-hc-spin" />
                            </span>
                            <span>Validating order...</span>
                        </div>
                    )}
                {!_.isEmpty(this.state.orderJSONErrMsg) && (
                    <Alert type={AlertTypes.ERROR} message={this.state.orderJSONErrMsg} />
                )}
            </div>
        );
    }
    private _renderVisualOrder() {
        const takerTokenAddress = this.state.parsedOrder.signedOrder.takerTokenAddress;
        const takerToken = this.props.tokenByAddress[takerTokenAddress];
        const orderTakerAmount = new BigNumber(this.state.parsedOrder.signedOrder.takerTokenAmount);
        const orderMakerAmount = new BigNumber(this.state.parsedOrder.signedOrder.makerTokenAmount);
        const takerAssetToken = {
            amount: orderTakerAmount.minus(this.state.unavailableTakerAmount),
            symbol: takerToken.symbol,
        };
        const fillToken = this.props.tokenByAddress[takerTokenAddress];
        const makerTokenAddress = this.state.parsedOrder.signedOrder.makerTokenAddress;
        const makerToken = this.props.tokenByAddress[makerTokenAddress];
        const makerAssetToken = {
            amount: orderMakerAmount.times(takerAssetToken.amount).div(orderTakerAmount),
            symbol: makerToken.symbol,
        };
        const fillAssetToken = {
            amount: this.props.orderFillAmount,
            symbol: takerToken.symbol,
        };
        const parsedOrderExpiration = new BigNumber(this.state.parsedOrder.signedOrder.expirationUnixTimestampSec);
        const exchangeRate = orderMakerAmount.div(orderTakerAmount);

        let orderReceiveAmount = 0;
        if (!_.isUndefined(this.props.orderFillAmount)) {
            const orderReceiveAmountBigNumber = exchangeRate.mul(this.props.orderFillAmount);
            orderReceiveAmount = this._formatCurrencyAmount(orderReceiveAmountBigNumber, makerToken.decimals);
        }
        const isUserMaker =
            !_.isUndefined(this.state.parsedOrder) &&
            this.state.parsedOrder.signedOrder.maker === this.props.userAddress;
        const expiryDate = utils.convertToReadableDateTimeFromUnixTimestamp(parsedOrderExpiration);
        return (
            <div className="pt3 pb1">
                <div className="clearfix pb2" style={{ width: '100%' }}>
                    <div className="inline left">Order details</div>
                    <div className="inline right" style={{ minWidth: 208 }}>
                        <div className="col col-4 pl2" style={{ color: colors.grey }}>
                            Maker:
                        </div>
                        <div className="col col-2 pr1">
                            <Identicon address={this.state.parsedOrder.signedOrder.maker} diameter={23} />
                        </div>
                        <div className="col col-6">
                            <EthereumAddress
                                address={this.state.parsedOrder.signedOrder.maker}
                                networkId={this.props.networkId}
                            />
                        </div>
                    </div>
                </div>
                <div className="lg-px4 md-px4 sm-px0">
                    <div className="lg-px4 md-px4 sm-px1 pt1">
                        <VisualOrder
                            makerAssetToken={makerAssetToken}
                            takerAssetToken={takerAssetToken}
                            tokenByAddress={this.props.tokenByAddress}
                            makerToken={makerToken}
                            takerToken={takerToken}
                            networkId={this.props.networkId}
                            isMakerTokenAddressInRegistry={this.state.isMakerTokenAddressInRegistry}
                            isTakerTokenAddressInRegistry={this.state.isTakerTokenAddressInRegistry}
                        />
                        <div className="center pt3 pb2">Expires: {expiryDate} UTC</div>
                    </div>
                </div>
                {!isUserMaker && (
                    <div className="clearfix mx-auto relative" style={{ width: 235, height: 108 }}>
                        <TokenAmountInput
                            blockchain={this.props.blockchain}
                            userAddress={this.props.userAddress}
                            networkId={this.props.networkId}
                            label="Fill amount"
                            onChange={this._onFillAmountChange.bind(this)}
                            shouldShowIncompleteErrs={false}
                            token={fillToken}
                            amount={fillAssetToken.amount}
                            shouldCheckBalance={true}
                            shouldCheckAllowance={true}
                            lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                        />
                        <div
                            className="absolute sm-hide xs-hide"
                            style={{
                                color: colors.grey400,
                                right: -247,
                                top: 39,
                                width: 242,
                            }}
                        >
                            = {accounting.formatNumber(orderReceiveAmount, 6)} {makerToken.symbol}
                        </div>
                    </div>
                )}
                <div>
                    {isUserMaker ? (
                        <div>
                            <RaisedButton
                                style={{ width: '100%' }}
                                disabled={this.state.isCancelling}
                                label={this.state.isCancelling ? 'Cancelling order...' : 'Cancel order'}
                                onClick={this._onCancelOrderClickFireAndForgetAsync.bind(this)}
                            />
                            {this.state.didCancelOrderSucceed && (
                                <Alert type={AlertTypes.SUCCESS} message={this._renderCancelSuccessMsg()} />
                            )}
                        </div>
                    ) : (
                        <div>
                            <RaisedButton
                                style={{ width: '100%' }}
                                disabled={this.state.isFilling}
                                label={this.state.isFilling ? 'Filling order...' : 'Fill order'}
                                onClick={this._onFillOrderClick.bind(this)}
                            />
                            {!_.isEmpty(this.state.globalErrMsg) && (
                                <Alert type={AlertTypes.ERROR} message={this.state.globalErrMsg} />
                            )}
                            {this.state.didFillOrderSucceed && (
                                <Alert type={AlertTypes.SUCCESS} message={this._renderFillSuccessMsg()} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }
    private _renderFillSuccessMsg() {
        return (
            <div>
                Order successfully filled. See the trade details in your{' '}
                <Link to={`${WebsitePaths.Portal}/trades`} style={{ color: colors.white }}>
                    trade history
                </Link>
            </div>
        );
    }
    private _renderCancelSuccessMsg() {
        return <div>Order successfully cancelled.</div>;
    }
    private _onFillOrderClick() {
        if (!this.state.isMakerTokenAddressInRegistry || !this.state.isTakerTokenAddressInRegistry) {
            this.setState({
                isFillWarningDialogOpen: true,
            });
        } else {
            // tslint:disable-next-line:no-floating-promises
            this._onFillOrderClickFireAndForgetAsync();
        }
    }
    private _onFillWarningClosed(didUserCancel: boolean) {
        this.setState({
            isFillWarningDialogOpen: false,
        });
        if (!didUserCancel) {
            // tslint:disable-next-line:no-floating-promises
            this._onFillOrderClickFireAndForgetAsync();
        }
    }
    private _onFillAmountChange(isValid: boolean, amount?: BigNumber) {
        this.props.dispatcher.updateOrderFillAmount(amount);
    }
    private _onFillOrderJSONChanged(event: any) {
        const orderJSON = event.target.value;
        this.setState({
            didOrderValidationRun: _.isEmpty(orderJSON) && _.isEmpty(this.state.orderJSONErrMsg),
            didFillOrderSucceed: false,
        });
        // tslint:disable-next-line:no-floating-promises
        this._validateFillOrderFireAndForgetAsync(orderJSON);
    }
    private async _checkForUntrackedTokensAndAskToAdd() {
        if (!_.isEmpty(this.state.orderJSONErrMsg)) {
            return;
        }

        const makerTokenIfExists = this.props.tokenByAddress[this.state.parsedOrder.signedOrder.makerTokenAddress];
        const takerTokenIfExists = this.props.tokenByAddress[this.state.parsedOrder.signedOrder.takerTokenAddress];

        const tokensToTrack: Token[] = [];
        const isUnseenMakerToken = _.isUndefined(makerTokenIfExists);
        const isMakerTokenTracked = !_.isUndefined(makerTokenIfExists) && makerTokenIfExists.isTracked;
        if (isUnseenMakerToken) {
            tokensToTrack.push({
                ...this.state.parsedOrder.metadata.makerToken,
                address: this.state.parsedOrder.signedOrder.makerTokenAddress,
                iconUrl: undefined,
                isTracked: false,
                isRegistered: false,
            });
        } else if (!isMakerTokenTracked) {
            tokensToTrack.push(makerTokenIfExists);
        }
        const isUnseenTakerToken = _.isUndefined(takerTokenIfExists);
        const isTakerTokenTracked = !_.isUndefined(takerTokenIfExists) && takerTokenIfExists.isTracked;
        if (isUnseenTakerToken) {
            tokensToTrack.push({
                ...this.state.parsedOrder.metadata.takerToken,
                address: this.state.parsedOrder.signedOrder.takerTokenAddress,
                iconUrl: undefined,
                isTracked: false,
                isRegistered: false,
            });
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
    private async _validateFillOrderFireAndForgetAsync(orderJSON: string) {
        let orderJSONErrMsg = '';
        let parsedOrder: Order;
        let orderHash: string;
        try {
            const order = JSON.parse(orderJSON);
            const validationResult = validator.validate(order, portalOrderSchema);
            if (validationResult.errors.length > 0) {
                orderJSONErrMsg = 'Submitted order JSON is not a valid order';
                logUtils.log(`Unexpected order JSON validation error: ${validationResult.errors.join(', ')}`);
                return;
            }
            parsedOrder = order;

            const makerAmount = new BigNumber(parsedOrder.signedOrder.makerTokenAmount);
            const takerAmount = new BigNumber(parsedOrder.signedOrder.takerTokenAmount);
            const expiration = new BigNumber(parsedOrder.signedOrder.expirationUnixTimestampSec);
            const salt = new BigNumber(parsedOrder.signedOrder.salt);
            const parsedMakerFee = new BigNumber(parsedOrder.signedOrder.makerFee);
            const parsedTakerFee = new BigNumber(parsedOrder.signedOrder.takerFee);

            const zeroExOrder: ZeroExOrder = {
                exchangeContractAddress: parsedOrder.signedOrder.exchangeContractAddress,
                expirationUnixTimestampSec: expiration,
                feeRecipient: parsedOrder.signedOrder.feeRecipient,
                maker: parsedOrder.signedOrder.maker,
                makerFee: parsedMakerFee,
                makerTokenAddress: parsedOrder.signedOrder.makerTokenAddress,
                makerTokenAmount: makerAmount,
                salt,
                taker: _.isEmpty(parsedOrder.signedOrder.taker)
                    ? constants.NULL_ADDRESS
                    : parsedOrder.signedOrder.taker,
                takerFee: parsedTakerFee,
                takerTokenAddress: parsedOrder.signedOrder.takerTokenAddress,
                takerTokenAmount: takerAmount,
            };
            orderHash = ZeroEx.getOrderHashHex(zeroExOrder);

            const exchangeContractAddr = this.props.blockchain.getExchangeContractAddressIfExists();
            const signature = parsedOrder.signedOrder.ecSignature;
            const isValidSignature = ZeroEx.isValidSignature(orderHash, signature, parsedOrder.signedOrder.maker);
            if (exchangeContractAddr !== parsedOrder.signedOrder.exchangeContractAddress) {
                orderJSONErrMsg = 'This order was made on another network or using a deprecated Exchange contract';
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
            logUtils.log(`Validate order err: ${err}`);
            if (!_.isEmpty(orderJSON)) {
                orderJSONErrMsg = 'Submitted order JSON is not valid JSON';
            }
            if (!this._isUnmounted) {
                this.setState({
                    didOrderValidationRun: true,
                    orderJSON,
                    orderJSONErrMsg,
                    parsedOrder,
                });
            }
            return;
        }

        let unavailableTakerAmount = new BigNumber(0);
        if (!_.isEmpty(orderJSONErrMsg)) {
            // Clear cache entry if user updates orderJSON to invalid entry
            this.props.dispatcher.updateUserSuppliedOrderCache(undefined);
        } else {
            unavailableTakerAmount = await this.props.blockchain.getUnavailableTakerAmountAsync(orderHash);
            const isMakerTokenAddressInRegistry = await this.props.blockchain.isAddressInTokenRegistryAsync(
                parsedOrder.signedOrder.makerTokenAddress,
            );
            const isTakerTokenAddressInRegistry = await this.props.blockchain.isAddressInTokenRegistryAsync(
                parsedOrder.signedOrder.takerTokenAddress,
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

        await this._checkForUntrackedTokensAndAskToAdd();
    }
    private async _onFillOrderClickFireAndForgetAsync(): Promise<void> {
        if (this.props.blockchainErr !== BlockchainErrs.NoError || _.isEmpty(this.props.userAddress)) {
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

        const signedOrder = this.props.blockchain.portalOrderToZeroExOrder(parsedOrder);
        if (_.isEmpty(globalErrMsg)) {
            try {
                await this.props.blockchain.validateFillOrderThrowIfInvalidAsync(
                    signedOrder,
                    takerFillAmount,
                    this.props.userAddress,
                );
            } catch (err) {
                globalErrMsg = utils.zeroExErrToHumanReadableErrMsg(err.message, parsedOrder.signedOrder.taker);
            }
        }
        if (!_.isEmpty(globalErrMsg)) {
            this.setState({
                isFilling: false,
                globalErrMsg,
            });
            return;
        }
        const networkName = sharedConstants.NETWORK_NAME_BY_ID[this.props.networkId];
        const eventLabel = `${parsedOrder.metadata.takerToken.symbol}-${networkName}`;
        try {
            const orderFilledAmount: BigNumber = await this.props.blockchain.fillOrderAsync(
                signedOrder,
                this.props.orderFillAmount,
            );
            analytics.logEvent('Portal', 'Fill Order Success', eventLabel, parsedOrder.signedOrder.takerTokenAmount);
            // After fill completes, let's force fetch the token balances
            this.props.dispatcher.forceTokenStateRefetch();
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
            analytics.logEvent('Portal', 'Fill Order Failure', eventLabel, parsedOrder.signedOrder.takerTokenAmount);
            const errMsg = `${err}`;
            if (utils.didUserDenyWeb3Request(errMsg)) {
                return;
            }
            globalErrMsg = 'Failed to fill order, please refresh and try again';
            logUtils.log(`${err}`);
            this.setState({
                globalErrMsg,
            });
            await errorReporter.reportAsync(err);
            return;
        }
    }
    private async _onCancelOrderClickFireAndForgetAsync(): Promise<void> {
        if (this.props.blockchainErr !== BlockchainErrs.NoError || _.isEmpty(this.props.userAddress)) {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            return;
        }

        this.setState({
            isCancelling: true,
            didCancelOrderSucceed: false,
        });

        const parsedOrder = this.state.parsedOrder;
        const takerAddress = this.props.userAddress;

        if (_.isUndefined(takerAddress)) {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            this.setState({
                isFilling: false,
            });
            return;
        }
        let globalErrMsg = '';

        const takerTokenAmount = new BigNumber(parsedOrder.signedOrder.takerTokenAmount);

        const signedOrder = this.props.blockchain.portalOrderToZeroExOrder(parsedOrder);
        const orderHash = ZeroEx.getOrderHashHex(signedOrder);
        const unavailableTakerAmount = await this.props.blockchain.getUnavailableTakerAmountAsync(orderHash);
        const availableTakerTokenAmount = takerTokenAmount.minus(unavailableTakerAmount);
        try {
            await this.props.blockchain.validateCancelOrderThrowIfInvalidAsync(signedOrder, availableTakerTokenAmount);
        } catch (err) {
            globalErrMsg = utils.zeroExErrToHumanReadableErrMsg(err.message, parsedOrder.signedOrder.taker);
        }
        if (!_.isEmpty(globalErrMsg)) {
            this.setState({
                isCancelling: false,
                globalErrMsg,
            });
            return;
        }
        const networkName = sharedConstants.NETWORK_NAME_BY_ID[this.props.networkId];
        const eventLabel = `${parsedOrder.metadata.makerToken.symbol}-${networkName}`;
        try {
            await this.props.blockchain.cancelOrderAsync(signedOrder, availableTakerTokenAmount);
            this.setState({
                isCancelling: false,
                didCancelOrderSucceed: true,
                globalErrMsg: '',
                unavailableTakerAmount: takerTokenAmount,
            });
            analytics.logEvent('Portal', 'Cancel Order Success', eventLabel, parsedOrder.signedOrder.makerTokenAmount);
            return;
        } catch (err) {
            this.setState({
                isCancelling: false,
            });
            const errMsg = `${err}`;
            if (utils.didUserDenyWeb3Request(errMsg)) {
                return;
            }
            analytics.logEvent('Portal', 'Cancel Order Failure', eventLabel, parsedOrder.signedOrder.makerTokenAmount);
            globalErrMsg = 'Failed to cancel order, please refresh and try again';
            logUtils.log(`${err}`);
            this.setState({
                globalErrMsg,
            });
            await errorReporter.reportAsync(err);
            return;
        }
    }
    private _formatCurrencyAmount(amount: BigNumber, decimals: number): number {
        const unitAmount = ZeroEx.toUnitAmount(amount, decimals);
        const roundedUnitAmount = Math.round(unitAmount.toNumber() * 100000) / 100000;
        return roundedUnitAmount;
    }
    private _onToggleTrackConfirmDialog(didConfirmTokenTracking: boolean) {
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
