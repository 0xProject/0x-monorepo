import { ZeroEx } from '0x.js';
import {
    colors,
    constants as sharedConstants,
    EtherscanLinkSuffixes,
    Networks,
    Styles,
    utils as sharedUtils,
} from '@0xproject/react-shared';
import { BigNumber, logUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import Divider from 'material-ui/Divider';
import FlatButton from 'material-ui/FlatButton';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import RaisedButton from 'material-ui/RaisedButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import ContentRemove from 'material-ui/svg-icons/content/remove';
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui/Table';
import * as React from 'react';
import ReactTooltip = require('react-tooltip');
import firstBy = require('thenby');
import { Blockchain } from 'ts/blockchain';
import { AssetPicker } from 'ts/components/generate_order/asset_picker';
import { AllowanceToggle } from 'ts/components/inputs/allowance_toggle';
import { SendButton } from 'ts/components/send_button';
import { HelpTooltip } from 'ts/components/ui/help_tooltip';
import { LifeCycleRaisedButton } from 'ts/components/ui/lifecycle_raised_button';
import { TokenIcon } from 'ts/components/ui/token_icon';
import { trackedTokenStorage } from 'ts/local_storage/tracked_token_storage';
import { Dispatcher } from 'ts/redux/dispatcher';
import {
    BalanceErrs,
    BlockchainCallErrs,
    BlockchainErrs,
    ScreenWidths,
    Token,
    TokenByAddress,
    TokenStateByAddress,
    TokenVisibility,
} from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';

const ETHER_ICON_PATH = '/images/ether.png';
const ETHER_TOKEN_SYMBOL = 'WETH';
const ZRX_TOKEN_SYMBOL = 'ZRX';

const ICON_DIMENSION = 40;
const ARTIFICIAL_FAUCET_REQUEST_DELAY = 1000;
const TOKEN_TABLE_ROW_HEIGHT = 60;
const MAX_TOKEN_TABLE_HEIGHT = 420;
const TOKEN_COL_SPAN_LG = 2;
const TOKEN_COL_SPAN_SM = 1;

const styles: Styles = {
    bgColor: {
        backgroundColor: colors.grey50,
    },
};

interface TokenBalancesProps {
    blockchain: Blockchain;
    blockchainErr: BlockchainErrs;
    blockchainIsLoaded: boolean;
    dispatcher: Dispatcher;
    screenWidth: ScreenWidths;
    tokenByAddress: TokenByAddress;
    trackedTokens: Token[];
    userAddress: string;
    userEtherBalanceInWei: BigNumber;
    networkId: number;
    lastForceTokenStateRefetch: number;
}

interface TokenBalancesState {
    errorType: BalanceErrs;
    isBalanceSpinnerVisible: boolean;
    isZRXSpinnerVisible: boolean;
    isTokenPickerOpen: boolean;
    isAddingToken: boolean;
    trackedTokenStateByAddress: TokenStateByAddress;
}

export class TokenBalances extends React.Component<TokenBalancesProps, TokenBalancesState> {
    private _isUnmounted: boolean;
    public constructor(props: TokenBalancesProps) {
        super(props);
        this._isUnmounted = false;
        const initialTrackedTokenStateByAddress = this._getInitialTrackedTokenStateByAddress(props.trackedTokens);
        this.state = {
            errorType: undefined,
            isBalanceSpinnerVisible: false,
            isZRXSpinnerVisible: false,
            isTokenPickerOpen: false,
            isAddingToken: false,
            trackedTokenStateByAddress: initialTrackedTokenStateByAddress,
        };
    }
    public componentWillMount(): void {
        const trackedTokenAddresses = _.keys(this.state.trackedTokenStateByAddress);
        // tslint:disable-next-line:no-floating-promises
        this._fetchBalancesAndAllowancesAsync(trackedTokenAddresses);
    }
    public componentWillUnmount(): void {
        this._isUnmounted = true;
    }
    public componentWillReceiveProps(nextProps: TokenBalancesProps): void {
        if (nextProps.userEtherBalanceInWei !== this.props.userEtherBalanceInWei) {
            if (this.state.isBalanceSpinnerVisible) {
                const receivedAmountInWei = nextProps.userEtherBalanceInWei.minus(this.props.userEtherBalanceInWei);
                const receivedAmountInEth = ZeroEx.toUnitAmount(receivedAmountInWei, constants.DECIMAL_PLACES_ETH);
                const networkName = sharedConstants.NETWORK_NAME_BY_ID[this.props.networkId];
                this.props.dispatcher.showFlashMessage(
                    `Received ${receivedAmountInEth.toString(10)} ${networkName} Ether`,
                );
            }
            this.setState({
                isBalanceSpinnerVisible: false,
            });
        }

        if (
            nextProps.userAddress !== this.props.userAddress ||
            nextProps.networkId !== this.props.networkId ||
            nextProps.lastForceTokenStateRefetch !== this.props.lastForceTokenStateRefetch
        ) {
            const trackedTokenAddresses = _.keys(this.state.trackedTokenStateByAddress);
            // tslint:disable-next-line:no-floating-promises
            this._fetchBalancesAndAllowancesAsync(trackedTokenAddresses);
        }

        if (!_.isEqual(nextProps.trackedTokens, this.props.trackedTokens)) {
            const newTokens = _.difference(nextProps.trackedTokens, this.props.trackedTokens);
            const newTokenAddresses = _.map(newTokens, token => token.address);
            // Add placeholder entry for this token to the state, since fetching the
            // balance/allowance is asynchronous
            const trackedTokenStateByAddress = this.state.trackedTokenStateByAddress;
            for (const tokenAddress of newTokenAddresses) {
                trackedTokenStateByAddress[tokenAddress] = {
                    balance: new BigNumber(0),
                    allowance: new BigNumber(0),
                    isLoaded: false,
                };
            }
            this.setState({
                trackedTokenStateByAddress,
            });
            // Fetch the actual balance/allowance.
            // tslint:disable-next-line:no-floating-promises
            this._fetchBalancesAndAllowancesAsync(newTokenAddresses);
        }
    }
    public componentDidMount(): void {
        window.scrollTo(0, 0);
    }
    public render(): React.ReactNode {
        const errorDialogActions = [
            <FlatButton
                key="errorOkBtn"
                label="Ok"
                primary={true}
                onTouchTap={this._onErrorDialogToggle.bind(this, false)}
            />,
        ];
        const isTestNetwork = utils.isTestNetwork(this.props.networkId);
        const isKovanTestNetwork = this.props.networkId === constants.NETWORK_ID_KOVAN;
        const stubColumnStyle = {
            display: isTestNetwork ? 'none' : 'table-cell',
        };
        const allTokenRowHeight = _.size(this.props.tokenByAddress) * TOKEN_TABLE_ROW_HEIGHT;
        const tokenTableHeight =
            allTokenRowHeight < MAX_TOKEN_TABLE_HEIGHT ? allTokenRowHeight : MAX_TOKEN_TABLE_HEIGHT;
        const isSmallScreen = this.props.screenWidth === ScreenWidths.Sm;
        const tokenColSpan = isSmallScreen ? TOKEN_COL_SPAN_SM : TOKEN_COL_SPAN_LG;
        const allowanceExplanation =
            '0x smart contracts require access to your<br> \
                                  token balances in order to execute trades.<br> \
                                  Toggling sets an allowance for the<br> \
                                  smart contract so you can start trading that token.';
        const userEtherBalanceInEth = ZeroEx.toUnitAmount(
            this.props.userEtherBalanceInWei,
            constants.DECIMAL_PLACES_ETH,
        );
        return (
            <div className="lg-px4 md-px4 sm-px1 pb2">
                <h3>{isTestNetwork ? 'Test ether' : 'Ether'}</h3>
                <Divider />
                <div className="pt2 pb2">
                    {isTestNetwork
                        ? 'In order to try out the 0x Portal Dapp, request some test ether to pay for \
                        gas costs. It might take a bit of time for the test ether to show up.'
                        : 'Ether must be converted to Ether Tokens in order to be tradable via 0x. \
                         You can convert between Ether and Ether Tokens from the "Wrap ETH" tab.'}
                </div>
                <Table selectable={false} style={styles.bgColor}>
                    <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                        <TableRow>
                            <TableHeaderColumn>Currency</TableHeaderColumn>
                            <TableHeaderColumn>Balance</TableHeaderColumn>
                            <TableRowColumn className="sm-hide xs-hide" style={stubColumnStyle} />
                            {isTestNetwork && (
                                <TableHeaderColumn style={{ paddingLeft: 3 }}>
                                    {isSmallScreen ? 'Faucet' : 'Request from faucet'}
                                </TableHeaderColumn>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody displayRowCheckbox={false}>
                        <TableRow key="ETH">
                            <TableRowColumn className="py1">
                                <img style={{ width: ICON_DIMENSION, height: ICON_DIMENSION }} src={ETHER_ICON_PATH} />
                            </TableRowColumn>
                            <TableRowColumn>
                                {userEtherBalanceInEth.toFixed(configs.AMOUNT_DISPLAY_PRECSION)} ETH
                                {this.state.isBalanceSpinnerVisible && (
                                    <span className="pl1">
                                        <i className="zmdi zmdi-spinner zmdi-hc-spin" />
                                    </span>
                                )}
                            </TableRowColumn>
                            <TableRowColumn className="sm-hide xs-hide" style={stubColumnStyle} />
                            {isTestNetwork && (
                                <TableRowColumn style={{ paddingLeft: 3 }}>
                                    <LifeCycleRaisedButton
                                        labelReady="Request"
                                        labelLoading="Sending..."
                                        labelComplete="Sent!"
                                        onClickAsyncFn={this._faucetRequestAsync.bind(this, true)}
                                    />
                                </TableRowColumn>
                            )}
                        </TableRow>
                    </TableBody>
                </Table>
                <div className="clearfix" style={{ paddingBottom: 1 }}>
                    <div className="col col-10">
                        <h3 className="pt2">{isTestNetwork ? 'Test tokens' : 'Tokens'}</h3>
                    </div>
                    <div className="col col-1 pt3 align-right">
                        <FloatingActionButton mini={true} zDepth={0} onClick={this._onAddTokenClicked.bind(this)}>
                            <ContentAdd />
                        </FloatingActionButton>
                    </div>
                    <div className="col col-1 pt3 align-right">
                        <FloatingActionButton mini={true} zDepth={0} onClick={this._onRemoveTokenClicked.bind(this)}>
                            <ContentRemove />
                        </FloatingActionButton>
                    </div>
                </div>
                <Divider />
                <div className="pt2 pb2">
                    {isTestNetwork
                        ? "Mint some test tokens you'd like to use to generate or fill an order using 0x."
                        : "Set trading permissions for a token you'd like to start trading."}
                </div>
                <Table selectable={false} bodyStyle={{ height: tokenTableHeight }} style={styles.bgColor}>
                    <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                        <TableRow>
                            <TableHeaderColumn colSpan={tokenColSpan}>Token</TableHeaderColumn>
                            <TableHeaderColumn style={{ paddingLeft: 3 }}>Balance</TableHeaderColumn>
                            <TableHeaderColumn>
                                <div className="inline-block">Allowance</div>
                                <HelpTooltip style={{ paddingLeft: 4 }} explanation={allowanceExplanation} />
                            </TableHeaderColumn>
                            <TableHeaderColumn>Action</TableHeaderColumn>
                            {this.props.screenWidth !== ScreenWidths.Sm && <TableHeaderColumn>Send</TableHeaderColumn>}
                        </TableRow>
                    </TableHeader>
                    <TableBody displayRowCheckbox={false}>{this._renderTokenTableRows()}</TableBody>
                </Table>
                <Dialog
                    title="Oh oh"
                    titleStyle={{ fontWeight: 100 }}
                    actions={errorDialogActions}
                    open={!_.isUndefined(this.state.errorType)}
                    onRequestClose={this._onErrorDialogToggle.bind(this, false)}
                >
                    {this._renderErrorDialogBody()}
                </Dialog>
                <AssetPicker
                    userAddress={this.props.userAddress}
                    networkId={this.props.networkId}
                    blockchain={this.props.blockchain}
                    dispatcher={this.props.dispatcher}
                    isOpen={this.state.isTokenPickerOpen}
                    currentTokenAddress={''}
                    onTokenChosen={this._onAssetTokenPicked.bind(this)}
                    tokenByAddress={this.props.tokenByAddress}
                    tokenVisibility={this.state.isAddingToken ? TokenVisibility.UNTRACKED : TokenVisibility.TRACKED}
                />
            </div>
        );
    }
    private _renderTokenTableRows(): React.ReactNode {
        if (!this.props.blockchainIsLoaded || this.props.blockchainErr !== BlockchainErrs.NoError) {
            return '';
        }
        const isSmallScreen = this.props.screenWidth === ScreenWidths.Sm;
        const tokenColSpan = isSmallScreen ? TOKEN_COL_SPAN_SM : TOKEN_COL_SPAN_LG;
        const actionPaddingX = isSmallScreen ? 2 : 24;
        const trackedTokens = this.props.trackedTokens;
        const trackedTokensStartingWithEtherToken = trackedTokens.sort(
            firstBy((t: Token) => t.symbol !== ETHER_TOKEN_SYMBOL)
                .thenBy((t: Token) => t.symbol !== ZRX_TOKEN_SYMBOL)
                .thenBy('address'),
        );
        const tableRows = _.map(
            trackedTokensStartingWithEtherToken,
            this._renderTokenRow.bind(this, tokenColSpan, actionPaddingX),
        );
        return tableRows;
    }
    private _renderTokenRow(tokenColSpan: number, actionPaddingX: number, token: Token): React.ReactNode {
        const tokenState = this.state.trackedTokenStateByAddress[token.address];
        const tokenLink = sharedUtils.getEtherScanLinkIfExists(
            token.address,
            this.props.networkId,
            EtherscanLinkSuffixes.Address,
        );
        const isMintable =
            (_.includes(configs.SYMBOLS_OF_MINTABLE_KOVAN_TOKENS, token.symbol) &&
                this.props.networkId === sharedConstants.NETWORK_ID_BY_NAME[Networks.Kovan]) ||
            (_.includes(configs.SYMBOLS_OF_MINTABLE_RINKEBY_ROPSTEN_TOKENS, token.symbol) &&
                _.includes(
                    [
                        sharedConstants.NETWORK_ID_BY_NAME[Networks.Rinkeby],
                        sharedConstants.NETWORK_ID_BY_NAME[Networks.Ropsten],
                    ],
                    this.props.networkId,
                ));
        return (
            <TableRow key={token.address} style={{ height: TOKEN_TABLE_ROW_HEIGHT }}>
                <TableRowColumn colSpan={tokenColSpan}>
                    {_.isUndefined(tokenLink) ? (
                        this._renderTokenName(token)
                    ) : (
                        <a href={tokenLink} target="_blank" style={{ textDecoration: 'none' }}>
                            {this._renderTokenName(token)}
                        </a>
                    )}
                </TableRowColumn>
                <TableRowColumn style={{ paddingRight: 3, paddingLeft: 3 }}>
                    {tokenState.isLoaded ? (
                        <span>
                            {this._renderAmount(tokenState.balance, token.decimals)} {token.symbol}
                            {this.state.isZRXSpinnerVisible &&
                                token.symbol === ZRX_TOKEN_SYMBOL && (
                                    <span className="pl1">
                                        <i className="zmdi zmdi-spinner zmdi-hc-spin" />
                                    </span>
                                )}
                        </span>
                    ) : (
                        <i className="zmdi zmdi-spinner zmdi-hc-spin" />
                    )}
                </TableRowColumn>
                <TableRowColumn>
                    <AllowanceToggle
                        networkId={this.props.networkId}
                        blockchain={this.props.blockchain}
                        dispatcher={this.props.dispatcher}
                        token={token}
                        tokenState={tokenState}
                        onErrorOccurred={this._onErrorOccurred.bind(this)}
                        userAddress={this.props.userAddress}
                        isDisabled={!tokenState.isLoaded}
                        refetchTokenStateAsync={this._refetchTokenStateAsync.bind(this, token.address)}
                    />
                </TableRowColumn>
                <TableRowColumn style={{ paddingLeft: actionPaddingX, paddingRight: actionPaddingX }}>
                    {isMintable && (
                        <LifeCycleRaisedButton
                            labelReady="Mint"
                            labelLoading={<span style={{ fontSize: 12 }}>Minting...</span>}
                            labelComplete="Minted!"
                            onClickAsyncFn={this._onMintTestTokensAsync.bind(this, token)}
                        />
                    )}
                    {token.symbol === ZRX_TOKEN_SYMBOL &&
                        utils.isTestNetwork(this.props.networkId) && (
                            <LifeCycleRaisedButton
                                labelReady="Request"
                                labelLoading="Sending..."
                                labelComplete="Sent!"
                                onClickAsyncFn={this._faucetRequestAsync.bind(this, false)}
                            />
                        )}
                </TableRowColumn>
                {this.props.screenWidth !== ScreenWidths.Sm && (
                    <TableRowColumn
                        style={{
                            paddingLeft: actionPaddingX,
                            paddingRight: actionPaddingX,
                        }}
                    >
                        <SendButton
                            userAddress={this.props.userAddress}
                            networkId={this.props.networkId}
                            blockchain={this.props.blockchain}
                            dispatcher={this.props.dispatcher}
                            token={token}
                            onError={this._onSendFailed.bind(this)}
                            lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                            refetchTokenStateAsync={this._refetchTokenStateAsync.bind(this, token.address)}
                        />
                    </TableRowColumn>
                )}
            </TableRow>
        );
    }
    private _onAssetTokenPicked(tokenAddress: string): void {
        if (_.isEmpty(tokenAddress)) {
            this.setState({
                isTokenPickerOpen: false,
            });
            return;
        }
        const token = this.props.tokenByAddress[tokenAddress];
        const isDefaultTrackedToken = _.includes(configs.DEFAULT_TRACKED_TOKEN_SYMBOLS, token.symbol);
        if (!this.state.isAddingToken && !isDefaultTrackedToken) {
            if (token.isRegistered) {
                // Remove the token from tracked tokens
                const newToken = {
                    ...token,
                    isTracked: false,
                };
                this.props.dispatcher.updateTokenByAddress([newToken]);
            } else {
                this.props.dispatcher.removeTokenToTokenByAddress(token);
            }
            trackedTokenStorage.removeTrackedToken(this.props.userAddress, this.props.networkId, tokenAddress);
        } else if (isDefaultTrackedToken) {
            this.props.dispatcher.showFlashMessage(`Cannot remove ${token.name} because it's a default token`);
        }
        this.setState({
            isTokenPickerOpen: false,
        });
    }
    private _onSendFailed(): void {
        this.setState({
            errorType: BalanceErrs.sendFailed,
        });
    }
    private _renderAmount(amount: BigNumber, decimals: number): React.ReactNode {
        const unitAmount = ZeroEx.toUnitAmount(amount, decimals);
        return unitAmount.toNumber().toFixed(configs.AMOUNT_DISPLAY_PRECSION);
    }
    private _renderTokenName(token: Token): React.ReactNode {
        const tooltipId = `tooltip-${token.address}`;
        return (
            <div className="flex">
                <TokenIcon token={token} diameter={ICON_DIMENSION} />
                <div data-tip={true} data-for={tooltipId} className="mt2 ml2 sm-hide xs-hide">
                    {token.name}
                </div>
                <ReactTooltip id={tooltipId}>{token.address}</ReactTooltip>
            </div>
        );
    }
    private _renderErrorDialogBody(): React.ReactNode {
        switch (this.state.errorType) {
            case BalanceErrs.incorrectNetworkForFaucet:
                return (
                    <div>
                        Our faucet can only send test Ether to addresses on testnets. Please make sure you are connected
                        to a testnet and try requesting again.
                    </div>
                );

            case BalanceErrs.faucetRequestFailed:
                return (
                    <div>
                        An unexpected error occurred while trying to request test Ether from our faucet. Please refresh
                        the page and try again.
                    </div>
                );

            case BalanceErrs.faucetQueueIsFull:
                return <div>Our test Ether faucet queue is full. Please try requesting test Ether again later.</div>;

            case BalanceErrs.mintingFailed:
                return <div>Minting your test tokens failed unexpectedly. Please refresh the page and try again.</div>;

            case BalanceErrs.allowanceSettingFailed:
                return (
                    <div>
                        An unexpected error occurred while trying to set your test token allowance. Please refresh the
                        page and try again.
                    </div>
                );

            case undefined:
                return null; // No error to show

            default:
                throw utils.spawnSwitchErr('errorType', this.state.errorType);
        }
    }
    private _onErrorOccurred(errorType: BalanceErrs): void {
        this.setState({
            errorType,
        });
    }
    private async _onMintTestTokensAsync(token: Token): Promise<boolean> {
        try {
            await this.props.blockchain.mintTestTokensAsync(token);
            await this._refetchTokenStateAsync(token.address);
            const amount = ZeroEx.toUnitAmount(constants.MINT_AMOUNT, token.decimals);
            this.props.dispatcher.showFlashMessage(`Successfully minted ${amount.toString(10)} ${token.symbol}`);
            return true;
        } catch (err) {
            const errMsg = `${err}`;
            if (_.includes(errMsg, BlockchainCallErrs.UserHasNoAssociatedAddresses)) {
                this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
                return false;
            }
            if (utils.didUserDenyWeb3Request(errMsg)) {
                return false;
            }
            logUtils.log(`Unexpected error encountered: ${err}`);
            logUtils.log(err.stack);
            this.setState({
                errorType: BalanceErrs.mintingFailed,
            });
            await errorReporter.reportAsync(err);
            return false;
        }
    }
    private async _faucetRequestAsync(isEtherRequest: boolean): Promise<boolean> {
        if (this.props.userAddress === '') {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            return false;
        }

        // If on another network other then the testnet our faucet serves test ether
        // from, we must show user an error message
        if (!utils.isTestNetwork(this.props.blockchain.networkId)) {
            this.setState({
                errorType: BalanceErrs.incorrectNetworkForFaucet,
            });
            return false;
        }

        await utils.sleepAsync(ARTIFICIAL_FAUCET_REQUEST_DELAY);

        const segment = isEtherRequest ? 'ether' : 'zrx';
        const response = await fetch(
            `${constants.URL_TESTNET_FAUCET}/${segment}/${this.props.userAddress}?networkId=${this.props.networkId}`,
        );
        const responseBody = await response.text();
        if (response.status !== constants.SUCCESS_STATUS) {
            logUtils.log(`Unexpected status code: ${response.status} -> ${responseBody}`);
            const errorType =
                response.status === constants.UNAVAILABLE_STATUS
                    ? BalanceErrs.faucetQueueIsFull
                    : BalanceErrs.faucetRequestFailed;
            this.setState({
                errorType,
            });
            await errorReporter.reportAsync(new Error(`Faucet returned non-200: ${JSON.stringify(response)}`));
            return false;
        }

        if (isEtherRequest) {
            this.setState({
                isBalanceSpinnerVisible: true,
            });
        } else {
            this.setState({
                isZRXSpinnerVisible: true,
            });
            // tslint:disable-next-line:no-floating-promises
            this._startPollingZrxBalanceAsync();
        }
        return true;
    }
    private _onErrorDialogToggle(isOpen: boolean): void {
        this.setState({
            errorType: undefined,
        });
    }
    private _onAddTokenClicked(): void {
        this.setState({
            isTokenPickerOpen: true,
            isAddingToken: true,
        });
    }
    private _onRemoveTokenClicked(): void {
        this.setState({
            isTokenPickerOpen: true,
            isAddingToken: false,
        });
    }
    private async _startPollingZrxBalanceAsync(): Promise<void> {
        const tokens = _.values(this.props.tokenByAddress);
        const zrxToken = _.find(tokens, t => t.symbol === ZRX_TOKEN_SYMBOL);

        // tslint:disable-next-line:no-floating-promises
        const balance = await this.props.blockchain.pollTokenBalanceAsync(zrxToken);
        const trackedTokenStateByAddress = this.state.trackedTokenStateByAddress;
        trackedTokenStateByAddress[zrxToken.address] = {
            ...trackedTokenStateByAddress[zrxToken.address],
            balance,
        };
        this.setState({
            isZRXSpinnerVisible: false,
        });
    }
    private async _fetchBalancesAndAllowancesAsync(tokenAddresses: string[]): Promise<void> {
        const trackedTokenStateByAddress = this.state.trackedTokenStateByAddress;
        const userAddressIfExists = _.isEmpty(this.props.userAddress) ? undefined : this.props.userAddress;
        for (const tokenAddress of tokenAddresses) {
            const [balance, allowance] = await this.props.blockchain.getTokenBalanceAndAllowanceAsync(
                userAddressIfExists,
                tokenAddress,
            );
            trackedTokenStateByAddress[tokenAddress] = {
                balance,
                allowance,
                isLoaded: true,
            };
        }
        if (!this._isUnmounted) {
            this.setState({
                trackedTokenStateByAddress,
            });
        }
    }
    private _getInitialTrackedTokenStateByAddress(trackedTokens: Token[]): TokenStateByAddress {
        const trackedTokenStateByAddress: TokenStateByAddress = {};
        _.each(trackedTokens, token => {
            trackedTokenStateByAddress[token.address] = {
                balance: new BigNumber(0),
                allowance: new BigNumber(0),
                isLoaded: false,
            };
        });
        return trackedTokenStateByAddress;
    }
    private async _refetchTokenStateAsync(tokenAddress: string): Promise<void> {
        const userAddressIfExists = _.isEmpty(this.props.userAddress) ? undefined : this.props.userAddress;
        const [balance, allowance] = await this.props.blockchain.getTokenBalanceAndAllowanceAsync(
            userAddressIfExists,
            tokenAddress,
        );
        this.setState({
            trackedTokenStateByAddress: {
                ...this.state.trackedTokenStateByAddress,
                [tokenAddress]: {
                    balance,
                    allowance,
                    isLoaded: true,
                },
            },
        });
    }
} // tslint:disable:max-file-line-count
