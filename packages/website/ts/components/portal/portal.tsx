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
import { AssetPicker } from 'ts/components/generate_order/asset_picker';
import { BackButton } from 'ts/components/portal/back_button';
import { Loading } from 'ts/components/portal/loading';
import { Menu, MenuTheme } from 'ts/components/portal/menu';
import { Section } from 'ts/components/portal/section';
import { TextHeader } from 'ts/components/portal/text_header';
import { RelayerIndex } from 'ts/components/relayer_index/relayer_index';
import { TokenBalances } from 'ts/components/token_balances';
import { TopBar, TopBarDisplayType } from 'ts/components/top_bar/top_bar';
import { TradeHistory } from 'ts/components/trade_history/trade_history';
import { FlashMessage } from 'ts/components/ui/flash_message';
import { Wallet } from 'ts/components/wallet/wallet';
import { GenerateOrderForm } from 'ts/containers/generate_order_form';
import { localStorage } from 'ts/local_storage/local_storage';
import { trackedTokenStorage } from 'ts/local_storage/tracked_token_storage';
import { FullscreenMessage } from 'ts/pages/fullscreen_message';
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

interface AccountManagementItem {
    pathName: string;
    headerText: string;
    render: () => React.ReactNode;
}

enum TokenManagementState {
    Add = 'Add',
    Remove = 'Remove',
    None = 'None',
}

const THROTTLE_TIMEOUT = 100;
const TOP_BAR_HEIGHT = TopBar.heightForDisplayType(TopBarDisplayType.Expanded);
const LEFT_COLUMN_WIDTH = 346;
const MENU_PADDING_LEFT = 185;

const styles: Styles = {
    root: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.lightestGrey,
    },
    body: {
        height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
    },
    leftColumn: {
        width: LEFT_COLUMN_WIDTH,
        height: '100%',
    },
    scrollContainer: {
        height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
        WebkitOverflowScrolling: 'touch',
        overflow: 'auto',
    },
};

export class Portal extends React.Component<PortalProps, PortalState> {
    private _blockchain: Blockchain;
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
                    <Switch>
                        <Route path={`${WebsitePaths.Portal}/:route`} render={this._renderOtherRoutes.bind(this)} />
                        <Route
                            exact={true}
                            path={`${WebsitePaths.Portal}/`}
                            render={this._renderMainRoute.bind(this)}
                        />
                    </Switch>
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
    private _renderMainRoute(): React.ReactNode {
        if (this._isSmallScreen()) {
            return <SmallLayout content={this._renderRelayerIndexSection()} />;
        } else {
            return <LargeLayout left={this._renderWalletSection()} right={this._renderRelayerIndexSection()} />;
        }
    }
    private _renderOtherRoutes(routeComponentProps: RouteComponentProps<any>): React.ReactNode {
        if (this._isSmallScreen()) {
            return <SmallLayout content={this._renderAccountManagement()} />;
        } else {
            return <LargeLayout left={this._renderMenu(routeComponentProps)} right={this._renderAccountManagement()} />;
        }
    }
    private _renderMenu(routeComponentProps: RouteComponentProps<any>): React.ReactNode {
        const menuTheme: MenuTheme = {
            paddingLeft: MENU_PADDING_LEFT,
            textColor: colors.darkerGrey,
            iconColor: colors.darkerGrey,
            selectedIconColor: colors.yellow800,
            selectedBackgroundColor: 'transparent',
        };
        return (
            <Section
                header={<BackButton to={`${WebsitePaths.Portal}`} labelText="back to Relayers" />}
                body={<Menu selectedPath={routeComponentProps.location.pathname} theme={menuTheme} />}
            />
        );
    }
    private _renderWallet(): React.ReactNode {
        const allTokens = _.values(this.props.tokenByAddress);
        const trackedTokens = _.filter(allTokens, t => t.isTracked);
        return (
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
        );
    }
    private _renderWalletSection(): React.ReactNode {
        return <Section header={<TextHeader labelText="Your Account" />} body={this._renderWallet()} />;
    }
    private _renderAccountManagement(): React.ReactNode {
        const accountManagementItems: AccountManagementItem[] = [
            {
                pathName: `${WebsitePaths.Portal}/weth`,
                headerText: 'Wrapped ETH',
                render: this._renderEthWrapper.bind(this),
            },
            {
                pathName: `${WebsitePaths.Portal}/account`,
                headerText: 'Your Account',
                render: this._isSmallScreen() ? this._renderWallet.bind(this) : this._renderTokenBalances.bind(this),
            },
            {
                pathName: `${WebsitePaths.Portal}/trades`,
                headerText: 'Trade History',
                render: this._renderTradeHistory.bind(this),
            },
            {
                pathName: `${WebsitePaths.Portal}/direct`,
                headerText: 'Trade Direct',
                render: this._renderTradeDirect.bind(this),
            },
        ];
        return (
            <Switch>
                {_.map(accountManagementItems, item => {
                    return (
                        <Route
                            key={item.pathName}
                            path={item.pathName}
                            render={this._renderAccountManagementItem.bind(this, item)}
                        />
                    );
                })}}
                <Route render={this._renderNotFoundMessage.bind(this)} />
            </Switch>
        );
    }
    private _renderAccountManagementItem(item: AccountManagementItem): React.ReactNode {
        return (
            <Section
                header={<TextHeader labelText={item.headerText} />}
                body={<Loading isLoading={!this.props.blockchainIsLoaded} content={item.render()} />}
            />
        );
    }
    private _renderEthWrapper(): React.ReactNode {
        return (
            <EthWrappers
                networkId={this.props.networkId}
                blockchain={this._blockchain}
                dispatcher={this.props.dispatcher}
                tokenByAddress={this.props.tokenByAddress}
                userAddress={this.props.userAddress}
                userEtherBalanceInWei={this.props.userEtherBalanceInWei}
                lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
            />
        );
    }
    private _renderTradeHistory(): React.ReactNode {
        return (
            <TradeHistory
                tokenByAddress={this.props.tokenByAddress}
                userAddress={this.props.userAddress}
                networkId={this.props.networkId}
            />
        );
    }
    private _renderTradeDirect(match: any, location: Location, history: History): React.ReactNode {
        return (
            <GenerateOrderForm
                blockchain={this._blockchain}
                hashData={this.props.hashData}
                dispatcher={this.props.dispatcher}
            />
        );
    }
    private _renderTokenBalances(): React.ReactNode {
        const allTokens = _.values(this.props.tokenByAddress);
        const trackedTokens = _.filter(allTokens, t => t.isTracked);
        return (
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
        );
    }
    private _renderRelayerIndexSection(): React.ReactNode {
        return (
            <Section
                header={<TextHeader labelText="Explore 0x Relayers" />}
                body={<RelayerIndex networkId={this.props.networkId} screenWidth={this.props.screenWidth} />}
            />
        );
    }
    private _renderNotFoundMessage(): React.ReactNode {
        return (
            <FullscreenMessage
                headerText="404 Not Found"
                bodyText="Hm... looks like we couldn't find what you are looking for."
            />
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
    private _isSmallScreen(): boolean {
        const isSmallScreen = this.props.screenWidth === ScreenWidths.Sm;
        return isSmallScreen;
    }
}

interface LargeLayoutProps {
    left: React.ReactNode;
    right: React.ReactNode;
}
const LargeLayout = (props: LargeLayoutProps) => {
    return (
        <div className="sm-flex flex-center">
            <div className="flex-last px3">
                <div style={styles.leftColumn}>{props.left}</div>
            </div>
            <div className="flex-auto px3" style={styles.scrollContainer}>
                {props.right}
            </div>
        </div>
    );
};

interface SmallLayoutProps {
    content: React.ReactNode;
}
const SmallLayout = (props: SmallLayoutProps) => {
    return (
        <div className="sm-flex flex-center">
            <div className="flex-auto px3" style={styles.scrollContainer}>
                {props.content}
            </div>
        </div>
    );
}; // tslint:disable:max-file-line-count
