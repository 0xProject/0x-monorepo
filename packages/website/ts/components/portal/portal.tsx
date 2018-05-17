import { colors, Styles } from '@0xproject/react-shared';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as React from 'react';
import * as DocumentTitle from 'react-document-title';
import { Link, Route, RouteComponentProps, Switch } from 'react-router-dom';

import { Blockchain } from 'ts/blockchain';
import { BlockchainErrDialog } from 'ts/components/dialogs/blockchain_err_dialog';
import { LedgerConfigDialog } from 'ts/components/dialogs/ledger_config_dialog';
import { PortalDisclaimerDialog } from 'ts/components/dialogs/portal_disclaimer_dialog';
import { EthWrappers } from 'ts/components/eth_wrappers';
import { FillOrder } from 'ts/components/fill_order';
import { AssetPicker } from 'ts/components/generate_order/asset_picker';
import { PortalMenu } from 'ts/components/portal/portal_menu';
import { RelayerIndex } from 'ts/components/relayer_index/relayer_index';
import { TokenBalances } from 'ts/components/token_balances';
import { TopBar, TopBarDisplayType } from 'ts/components/top_bar/top_bar';
import { TradeHistory } from 'ts/components/trade_history/trade_history';
import { FlashMessage } from 'ts/components/ui/flash_message';
import { Wallet } from 'ts/components/wallet/wallet';
import { GenerateOrderForm } from 'ts/containers/generate_order_form';
import { localStorage } from 'ts/local_storage/local_storage';
import { trackedTokenStorage } from 'ts/local_storage/tracked_token_storage';
import { Dispatcher } from 'ts/redux/dispatcher';
import {
    BlockchainErrs,
    HashData,
    Order,
    ProviderType,
    ScreenWidths,
    TokenByAddress,
    TokenVisibility,
    WebsitePaths,
} from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

export interface PortalProps {
    blockchainErr: BlockchainErrs;
    blockchainIsLoaded: boolean;
    dispatcher: Dispatcher;
    hashData: HashData;
    injectedProviderName: string;
    networkId: number;
    nodeVersion: string;
    orderFillAmount: BigNumber;
    providerType: ProviderType;
    screenWidth: ScreenWidths;
    tokenByAddress: TokenByAddress;
    userEtherBalanceInWei: BigNumber;
    userAddress: string;
    shouldBlockchainErrDialogBeOpen: boolean;
    userSuppliedOrderCache: Order;
    location: Location;
    flashMessage?: string | React.ReactNode;
    lastForceTokenStateRefetch: number;
    translate: Translate;
}

interface PortalState {
    prevNetworkId: number;
    prevNodeVersion: string;
    prevUserAddress: string;
    prevPathname: string;
    isDisclaimerDialogOpen: boolean;
    isLedgerDialogOpen: boolean;
    tokenManagementState: TokenManagementState;
}

enum TokenManagementState {
    Add = 'Add',
    Remove = 'Remove',
    None = 'None',
}

const THROTTLE_TIMEOUT = 100;
const TOP_BAR_HEIGHT = TopBar.heightForDisplayType(TopBarDisplayType.Expanded);
const BACK_BUTTON_HEIGHT = 28;

const styles: Styles = {
    root: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.lightestGrey,
    },
    body: {
        height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
    },
    scrollContainer: {
        height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
        WebkitOverflowScrolling: 'touch',
        overflow: 'auto',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 20,
    },
    backButton: {
        height: BACK_BUTTON_HEIGHT,
        backgroundColor: colors.white,
        borderRadius: BACK_BUTTON_HEIGHT,
        boxShadow: `0px 4px 6px ${colors.walletBoxShadow}`,
    },
    backButtonIcon: {
        color: colors.mediumBlue,
        fontSize: 20,
    },
};

export class Portal extends React.Component<PortalProps, PortalState> {
    private _blockchain: Blockchain;
    private _sharedOrderIfExists: Order;
    private _throttledScreenWidthUpdate: () => void;
    constructor(props: PortalProps) {
        super(props);
        this._throttledScreenWidthUpdate = _.throttle(this._updateScreenWidth.bind(this), THROTTLE_TIMEOUT);
        const didAcceptPortalDisclaimer = localStorage.getItemIfExists(constants.LOCAL_STORAGE_KEY_ACCEPT_DISCLAIMER);
        const hasAcceptedDisclaimer =
            !_.isUndefined(didAcceptPortalDisclaimer) && !_.isEmpty(didAcceptPortalDisclaimer);
        this.state = {
            prevNetworkId: this.props.networkId,
            prevNodeVersion: this.props.nodeVersion,
            prevUserAddress: this.props.userAddress,
            prevPathname: this.props.location.pathname,
            isDisclaimerDialogOpen: !hasAcceptedDisclaimer,
            tokenManagementState: TokenManagementState.None,
            isLedgerDialogOpen: false,
        };
    }
    public componentDidMount(): void {
        window.addEventListener('resize', this._throttledScreenWidthUpdate);
        window.scrollTo(0, 0);
    }
    public componentWillMount(): void {
        this._blockchain = new Blockchain(this.props.dispatcher);
    }
    public componentWillUnmount(): void {
        this._blockchain.destroy();
        window.removeEventListener('resize', this._throttledScreenWidthUpdate);
        // We re-set the entire redux state when the portal is unmounted so that when it is re-rendered
        // the initialization process always occurs from the same base state. This helps avoid
        // initialization inconsistencies (i.e While the portal was unrendered, the user might have
        // become disconnected from their backing Ethereum node, changed user accounts, etc...)
        this.props.dispatcher.resetState();
    }
    public componentWillReceiveProps(nextProps: PortalProps): void {
        if (nextProps.networkId !== this.state.prevNetworkId) {
            // tslint:disable-next-line:no-floating-promises
            this._blockchain.networkIdUpdatedFireAndForgetAsync(nextProps.networkId);
            this.setState({
                prevNetworkId: nextProps.networkId,
            });
        }
        if (nextProps.userAddress !== this.state.prevUserAddress) {
            const newUserAddress = _.isEmpty(nextProps.userAddress) ? undefined : nextProps.userAddress;
            // tslint:disable-next-line:no-floating-promises
            this._blockchain.userAddressUpdatedFireAndForgetAsync(newUserAddress);
            this.setState({
                prevUserAddress: nextProps.userAddress,
            });
        }
        if (nextProps.nodeVersion !== this.state.prevNodeVersion) {
            // tslint:disable-next-line:no-floating-promises
            this._blockchain.nodeVersionUpdatedFireAndForgetAsync(nextProps.nodeVersion);
        }
        if (nextProps.location.pathname !== this.state.prevPathname) {
            this.setState({
                prevPathname: nextProps.location.pathname,
            });
        }
    }
    public render(): React.ReactNode {
        const updateShouldBlockchainErrDialogBeOpen = this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen.bind(
            this.props.dispatcher,
        );
        const isAssetPickerDialogOpen = this.state.tokenManagementState !== TokenManagementState.None;
        const tokenVisibility =
            this.state.tokenManagementState === TokenManagementState.Add
                ? TokenVisibility.UNTRACKED
                : TokenVisibility.TRACKED;
        return (
            <div style={styles.root}>
                <DocumentTitle title="0x Portal DApp" />
                <TopBar
                    userAddress={this.props.userAddress}
                    networkId={this.props.networkId}
                    injectedProviderName={this.props.injectedProviderName}
                    onToggleLedgerDialog={this._onToggleLedgerDialog.bind(this)}
                    dispatcher={this.props.dispatcher}
                    providerType={this.props.providerType}
                    blockchainIsLoaded={this.props.blockchainIsLoaded}
                    location={this.props.location}
                    blockchain={this._blockchain}
                    translate={this.props.translate}
                    displayType={TopBarDisplayType.Expanded}
                    style={{ backgroundColor: colors.lightestGrey }}
                />
                <div id="portal" style={styles.body}>
                    <div className="sm-flex flex-center">
                        <div className="flex-last px3">
                            <div style={{ width: 346 }}>
                                <Switch>
                                    <Route
                                        path={`${WebsitePaths.Portal}/:route`}
                                        render={this._renderMenu.bind(this)}
                                    />
                                    <Route
                                        exact={true}
                                        path={`${WebsitePaths.Portal}`}
                                        component={this._renderWallet.bind(this)}
                                    />
                                </Switch>
                            </div>
                        </div>
                        <div className="flex-auto px3" style={styles.scrollContainer}>
                            <Switch>
                                <Route
                                    path={`${WebsitePaths.Portal}/weth`}
                                    render={this._renderEthWrapper.bind(this)}
                                />
                                <Route
                                    path={`${WebsitePaths.Portal}/account`}
                                    render={this._renderTokenBalances.bind(this)}
                                />
                                <Route
                                    path={`${WebsitePaths.Portal}/trades`}
                                    component={this._renderTradeHistory.bind(this)}
                                />
                                <Route
                                    path={`${WebsitePaths.Portal}/direct`}
                                    component={this._renderTradeDirect.bind(this)}
                                />
                                <Route path={`${WebsitePaths.Home}`} component={this._renderRelayerIndex.bind(this)} />
                            </Switch>
                        </div>
                    </div>
                    <BlockchainErrDialog
                        blockchain={this._blockchain}
                        blockchainErr={this.props.blockchainErr}
                        isOpen={this.props.shouldBlockchainErrDialogBeOpen}
                        userAddress={this.props.userAddress}
                        toggleDialogFn={updateShouldBlockchainErrDialogBeOpen}
                        networkId={this.props.networkId}
                    />
                    <PortalDisclaimerDialog
                        isOpen={this.state.isDisclaimerDialogOpen}
                        onToggleDialog={this._onPortalDisclaimerAccepted.bind(this)}
                    />
                    <FlashMessage dispatcher={this.props.dispatcher} flashMessage={this.props.flashMessage} />
                    {this.props.blockchainIsLoaded && (
                        <LedgerConfigDialog
                            providerType={this.props.providerType}
                            networkId={this.props.networkId}
                            blockchain={this._blockchain}
                            dispatcher={this.props.dispatcher}
                            toggleDialogFn={this._onToggleLedgerDialog.bind(this)}
                            isOpen={this.state.isLedgerDialogOpen}
                        />
                    )}
                    <AssetPicker
                        userAddress={this.props.userAddress}
                        networkId={this.props.networkId}
                        blockchain={this._blockchain}
                        dispatcher={this.props.dispatcher}
                        isOpen={isAssetPickerDialogOpen}
                        currentTokenAddress={''}
                        onTokenChosen={this._onTokenChosen.bind(this)}
                        tokenByAddress={this.props.tokenByAddress}
                        tokenVisibility={tokenVisibility}
                    />
                </div>
            </div>
        );
    }
    private _renderMenu(routeComponentProps: RouteComponentProps<any>) {
        return (
            <div>
                <BackButton to={`${WebsitePaths.Portal}`} labelText={'back to Relayers'} />
                <PortalMenu selectedPath={routeComponentProps.location.pathname} />
            </div>
        );
    }
    private _renderWallet() {
        const allTokens = _.values(this.props.tokenByAddress);
        const trackedTokens = _.filter(allTokens, t => t.isTracked);
        return (
            <div>
                <Title labelText={'Your Account'} />
                <Wallet
                    userAddress={this.props.userAddress}
                    networkId={this.props.networkId}
                    blockchain={this._blockchain}
                    blockchainIsLoaded={this.props.blockchainIsLoaded}
                    blockchainErr={this.props.blockchainErr}
                    dispatcher={this.props.dispatcher}
                    tokenByAddress={this.props.tokenByAddress}
                    trackedTokens={trackedTokens}
                    userEtherBalanceInWei={this.props.userEtherBalanceInWei}
                    lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                    injectedProviderName={this.props.injectedProviderName}
                    providerType={this.props.providerType}
                    onToggleLedgerDialog={this._onToggleLedgerDialog.bind(this)}
                    onAddToken={this._onAddToken.bind(this)}
                    onRemoveToken={this._onRemoveToken.bind(this)}
                />
            </div>
        );
    }
    private _renderEthWrapper() {
        return (
            <div>
                <Title labelText={'Wrapped ETH'} />
                <EthWrappers
                    networkId={this.props.networkId}
                    blockchain={this._blockchain}
                    dispatcher={this.props.dispatcher}
                    tokenByAddress={this.props.tokenByAddress}
                    userAddress={this.props.userAddress}
                    userEtherBalanceInWei={this.props.userEtherBalanceInWei}
                    lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                />
            </div>
        );
    }
    private _renderTradeHistory() {
        return (
            <div>
                <Title labelText={'Trade History'} />
                <TradeHistory
                    tokenByAddress={this.props.tokenByAddress}
                    userAddress={this.props.userAddress}
                    networkId={this.props.networkId}
                />
            </div>
        );
    }
    private _renderTradeDirect(match: any, location: Location, history: History) {
        return (
            <div>
                <Title labelText={'Trade Direct'} />
                <GenerateOrderForm
                    blockchain={this._blockchain}
                    hashData={this.props.hashData}
                    dispatcher={this.props.dispatcher}
                />
            </div>
        );
    }
    private _renderTokenBalances() {
        const allTokens = _.values(this.props.tokenByAddress);
        const trackedTokens = _.filter(allTokens, t => t.isTracked);
        return (
            <div>
                <Title labelText={'Your Account'} />
                <TokenBalances
                    blockchain={this._blockchain}
                    blockchainErr={this.props.blockchainErr}
                    blockchainIsLoaded={this.props.blockchainIsLoaded}
                    dispatcher={this.props.dispatcher}
                    screenWidth={this.props.screenWidth}
                    tokenByAddress={this.props.tokenByAddress}
                    trackedTokens={trackedTokens}
                    userAddress={this.props.userAddress}
                    userEtherBalanceInWei={this.props.userEtherBalanceInWei}
                    networkId={this.props.networkId}
                    lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                />
            </div>
        );
    }
    private _renderRelayerIndex() {
        return (
            <div>
                <Title labelText={'Explore 0x Relayers'} />
                <RelayerIndex networkId={this.props.networkId} />
            </div>
        );
    }
    private _onTokenChosen(tokenAddress: string): void {
        if (_.isEmpty(tokenAddress)) {
            this.setState({
                tokenManagementState: TokenManagementState.None,
            });
            return;
        }
        const token = this.props.tokenByAddress[tokenAddress];
        const isDefaultTrackedToken = _.includes(configs.DEFAULT_TRACKED_TOKEN_SYMBOLS, token.symbol);
        if (this.state.tokenManagementState === TokenManagementState.Remove && !isDefaultTrackedToken) {
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
            tokenManagementState: TokenManagementState.None,
        });
    }
    private _onToggleLedgerDialog(): void {
        this.setState({
            isLedgerDialogOpen: !this.state.isLedgerDialogOpen,
        });
    }
    private _onAddToken(): void {
        this.setState({
            tokenManagementState: TokenManagementState.Add,
        });
    }
    private _onRemoveToken(): void {
        this.setState({
            tokenManagementState: TokenManagementState.Remove,
        });
    }
    private _onPortalDisclaimerAccepted(): void {
        localStorage.setItem(constants.LOCAL_STORAGE_KEY_ACCEPT_DISCLAIMER, 'set');
        this.setState({
            isDisclaimerDialogOpen: false,
        });
    }
    private _updateScreenWidth(): void {
        const newScreenWidth = utils.getScreenWidth();
        this.props.dispatcher.updateScreenWidth(newScreenWidth);
    }
}

interface TitleProps {
    labelText: string;
}
const Title = (props: TitleProps) => {
    return (
        <div className="py3" style={styles.title}>
            {props.labelText}
        </div>
    );
};

interface BackButtonProps {
    to: string;
    labelText: string;
}
const BackButton = (props: BackButtonProps) => {
    return (
        <div style={{ height: 65, paddingTop: 25 }}>
            <Link to={props.to} style={{ textDecoration: 'none' }}>
                <div className="flex right" style={{ ...styles.backButton, paddingTop: 10 }}>
                    <div style={{ marginLeft: 12 }}>
                        <i style={styles.backButtonIcon} className={`zmdi zmdi-arrow-left`} />
                    </div>
                    <div style={{ marginLeft: 12, marginRight: 12 }}>
                        <div style={{ fontSize: 16, color: colors.lightGrey }}>{props.labelText}</div>
                    </div>
                </div>
            </Link>
        </div>
    );
};
