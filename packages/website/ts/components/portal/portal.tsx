import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { Redirect, Route, RouteComponentProps, Switch } from 'react-router-dom';
import { Link } from 'ts/components/documentation/shared/link';
import { colors } from 'ts/style/colors';

import { Blockchain } from 'ts/blockchain';
import { ANNOUNCEMENT_BANNER_HEIGHT, AnnouncementBanner } from 'ts/components/annoucement_banner';
import { BlockchainErrDialog } from 'ts/components/dialogs/blockchain_err_dialog';
import { LedgerConfigDialog } from 'ts/components/dialogs/ledger_config_dialog';
import { PortalDisclaimerDialog } from 'ts/components/dialogs/portal_disclaimer_dialog';
import { EthWrappers } from 'ts/components/eth_wrappers';
import { FillOrder } from 'ts/components/fill_order';
import { AssetPicker } from 'ts/components/generate_order/asset_picker';
import { MetaTags } from 'ts/components/meta_tags';
import { Loading } from 'ts/components/portal/loading';
import { Menu, MenuTheme } from 'ts/components/portal/menu';
import { Section } from 'ts/components/portal/section';
import { TextHeader } from 'ts/components/portal/text_header';
import { RelayerIndex, RelayerIndexCellStyle } from 'ts/components/relayer_index/relayer_index';
import { TokenBalances } from 'ts/components/token_balances';
import { TopBar, TopBarDisplayType } from 'ts/components/top_bar/top_bar';
import { TradeHistory } from 'ts/components/trade_history/trade_history';
import { Container } from 'ts/components/ui/container';
import { FlashMessage } from 'ts/components/ui/flash_message';
import { Image } from 'ts/components/ui/image';
import { PointerDirection } from 'ts/components/ui/pointer';
import { Text } from 'ts/components/ui/text';
import { Wallet } from 'ts/components/wallet/wallet';
import { GenerateOrderForm } from 'ts/containers/generate_order_form';
import { PortalOnboardingFlow } from 'ts/containers/portal_onboarding_flow';
import { localStorage } from 'ts/local_storage/local_storage';
import { trackedTokenStorage } from 'ts/local_storage/tracked_token_storage';
import { FullscreenMessage } from 'ts/pages/fullscreen_message';
import { Dispatcher } from 'ts/redux/dispatcher';
import { zIndex } from 'ts/style/z_index';
import {
    BlockchainErrs,
    HashData,
    ItemByAddress,
    PortalOrder,
    ProviderType,
    ScreenWidths,
    Token,
    TokenByAddress,
    TokenStateByAddress,
    TokenVisibility,
    WebsitePaths,
} from 'ts/types';
import { analytics } from 'ts/utils/analytics';
import { backendClient } from 'ts/utils/backend_client';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { orderParser } from 'ts/utils/order_parser';
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
    userEtherBalanceInWei?: BigNumber;
    userAddress: string;
    shouldBlockchainErrDialogBeOpen: boolean;
    userSuppliedOrderCache: PortalOrder;
    location: Location;
    flashMessage?: string | React.ReactNode;
    lastForceTokenStateRefetch: number;
    translate: Translate;
    isPortalOnboardingShowing: boolean;
    portalOnboardingStep: number;
}

interface PortalState {
    prevNetworkId: number;
    prevNodeVersion: string;
    prevUserAddress: string;
    prevPathname: string;
    isDisclaimerDialogOpen: boolean;
    isLedgerDialogOpen: boolean;
    tokenManagementState: TokenManagementState;
    trackedTokenStateByAddress: TokenStateByAddress;
    dismissBanner: boolean;
}

interface AccountManagementItem {
    pathName: string;
    headerText?: string;
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
const LARGE_LAYOUT_MAX_WIDTH = 1200;
const SIDE_PADDING = 20;
const DOCUMENT_TITLE = '0x Portal';
const DOCUMENT_DESCRIPTION = 'Learn about and trade on 0x Relayers';

export class Portal extends React.Component<PortalProps, PortalState> {
    private _blockchain: Blockchain;
    private readonly _sharedOrderIfExists: PortalOrder;
    private readonly _throttledScreenWidthUpdate: () => void;
    constructor(props: PortalProps) {
        super(props);
        this._blockchain = new Blockchain(this.props.dispatcher);
        this._sharedOrderIfExists = orderParser.parseQueryString(window.location.search);
        this._throttledScreenWidthUpdate = _.throttle(this._updateScreenWidth.bind(this), THROTTLE_TIMEOUT);
        const didAcceptPortalDisclaimer = localStorage.getItemIfExists(constants.LOCAL_STORAGE_KEY_ACCEPT_DISCLAIMER);
        const hasAcceptedDisclaimer = didAcceptPortalDisclaimer !== undefined && !_.isEmpty(didAcceptPortalDisclaimer);
        const initialTrackedTokenStateByAddress = this._getInitialTrackedTokenStateByAddress(
            this._getCurrentTrackedTokens(),
        );
        this.state = {
            prevNetworkId: this.props.networkId,
            prevNodeVersion: this.props.nodeVersion,
            prevUserAddress: this.props.userAddress,
            prevPathname: this.props.location.pathname,
            isDisclaimerDialogOpen: !hasAcceptedDisclaimer,
            tokenManagementState: TokenManagementState.None,
            isLedgerDialogOpen: false,
            dismissBanner: false,
            trackedTokenStateByAddress: initialTrackedTokenStateByAddress,
        };
    }
    public componentDidMount(): void {
        window.addEventListener('resize', this._throttledScreenWidthUpdate);
        window.scrollTo(0, 0);
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
    public componentDidUpdate(prevProps: PortalProps): void {
        if (!prevProps.blockchainIsLoaded && this.props.blockchainIsLoaded) {
            // tslint:disable-next-line:no-floating-promises
            this._fetchBalancesAndAllowancesAsync(this._getCurrentTrackedTokensAddresses());
        }
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

        // If the address changed, but the network did not, we can just refetch the currently tracked tokens.
        if (
            (nextProps.userAddress !== this.props.userAddress && nextProps.networkId === this.props.networkId) ||
            nextProps.lastForceTokenStateRefetch !== this.props.lastForceTokenStateRefetch
        ) {
            // tslint:disable-next-line:no-floating-promises
            this._fetchBalancesAndAllowancesAsync(this._getCurrentTrackedTokensAddresses());
        }

        const nextTrackedTokens = utils.getTrackedTokens(nextProps.tokenByAddress);
        const trackedTokens = this._getCurrentTrackedTokens();

        if (!_.isEqual(nextTrackedTokens, trackedTokens)) {
            const newTokens = _.difference(nextTrackedTokens, trackedTokens);
            const newTokenAddresses = _.map(newTokens, token => token.address);
            // Add placeholder entry for this token to the state, since fetching the
            // balance/allowance is asynchronous
            const trackedTokenStateByAddress = { ...this.state.trackedTokenStateByAddress };
            for (const tokenAddress of newTokenAddresses) {
                trackedTokenStateByAddress[tokenAddress] = {
                    balance: new BigNumber(0),
                    allowance: new BigNumber(0),
                    isLoaded: false,
                };
            }
            this.setState(
                {
                    trackedTokenStateByAddress,
                },
                () => {
                    // Fetch the actual balance/allowance.
                    // tslint:disable-next-line:no-floating-promises
                    this._fetchBalancesAndAllowancesAsync(newTokenAddresses);
                },
            );
        }
    }
    public render(): React.ReactNode {
        const updateShouldBlockchainErrDialogBeOpen = this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen.bind(
            this.props.dispatcher,
        );
        const isAssetPickerDialogOpen = this.state.tokenManagementState !== TokenManagementState.None;
        const tokenVisibility =
            this.state.tokenManagementState === TokenManagementState.Add
                ? TokenVisibility.Untracked
                : TokenVisibility.Tracked;
        return (
            <Container>
                <MetaTags title={DOCUMENT_TITLE} description={DOCUMENT_DESCRIPTION} />
                <AnnouncementBanner
                    dismissed={this.state.dismissBanner}
                    onDismiss={this._dismissBanner.bind(this)}
                    heading="Check out the new 0x Explore page"
                    subline="Need more advanced functionality? Try our code sandbox."
                    mainCta={{ text: 'Explore 0x', href: WebsitePaths.Explore }}
                    secondaryCta={{
                        text: 'Code Sandbox',
                        href: constants.URL_SANDBOX,
                        shouldOpenInNewTab: true,
                    }}
                />
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
                    style={{
                        backgroundColor: colors.lightestGrey,
                        position: 'fixed',
                        transition: '300ms top ease-in-out',
                        top: this.state.dismissBanner ? '0' : ANNOUNCEMENT_BANNER_HEIGHT,
                        zIndex: zIndex.topBar,
                    }}
                    maxWidth={LARGE_LAYOUT_MAX_WIDTH}
                />
                <Container
                    marginTop={`calc(${TOP_BAR_HEIGHT}px + ${
                        this.state.dismissBanner ? '0px' : ANNOUNCEMENT_BANNER_HEIGHT
                    })`}
                    minHeight="100vh"
                    backgroundColor={colors.lightestGrey}
                >
                    <Switch>
                        <Route path={`${WebsitePaths.Portal}/:route`} render={this._renderOtherRoutes.bind(this)} />
                        <Redirect from={WebsitePaths.Portal} to={`/portal/account`} />
                    </Switch>
                    <BlockchainErrDialog
                        blockchain={this._blockchain}
                        blockchainErr={this.props.blockchainErr}
                        isOpen={this.props.shouldBlockchainErrDialogBeOpen}
                        userAddress={this.props.userAddress}
                        toggleDialogFn={updateShouldBlockchainErrDialogBeOpen}
                        networkId={this.props.networkId}
                    />
                    <FlashMessage dispatcher={this.props.dispatcher} flashMessage={this.props.flashMessage} />

                    <LedgerConfigDialog
                        providerType={this.props.providerType}
                        networkId={this.props.networkId}
                        blockchain={this._blockchain}
                        dispatcher={this.props.dispatcher}
                        toggleDialogFn={this._onToggleLedgerDialog.bind(this)}
                        isOpen={this.state.isLedgerDialogOpen}
                    />

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
                </Container>
            </Container>
        );
    }
    private _dismissBanner(): void {
        this.setState({ dismissBanner: true });
    }

    // tslint:disable-next-line:no-unused-variable
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
        return <Section body={<Menu selectedPath={routeComponentProps.location.pathname} theme={menuTheme} />} />;
    }
    private _renderWallet(): React.ReactNode {
        const isMobile = utils.isMobileWidth(this.props.screenWidth);
        // We need room to scroll down for mobile onboarding
        const marginBottom = isMobile ? '250px' : '15px';
        return (
            <div>
                <Container className="flex flex-column items-center">
                    {isMobile && (
                        <Container marginTop="20px" marginBottom="20px">
                            {this._renderStartOnboarding()}
                        </Container>
                    )}
                    <Container marginBottom={marginBottom} width="100%">
                        <Wallet
                            style={
                                !isMobile && this.props.isPortalOnboardingShowing
                                    ? { zIndex: zIndex.aboveOverlay, position: 'relative' }
                                    : undefined
                            }
                            userAddress={this.props.userAddress}
                            networkId={this.props.networkId}
                            blockchain={this._blockchain}
                            blockchainIsLoaded={this.props.blockchainIsLoaded}
                            blockchainErr={this.props.blockchainErr}
                            dispatcher={this.props.dispatcher}
                            tokenByAddress={this.props.tokenByAddress}
                            trackedTokens={this._getCurrentTrackedTokens()}
                            userEtherBalanceInWei={this.props.userEtherBalanceInWei}
                            lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                            injectedProviderName={this.props.injectedProviderName}
                            providerType={this.props.providerType}
                            screenWidth={this.props.screenWidth}
                            location={this.props.location}
                            trackedTokenStateByAddress={this.state.trackedTokenStateByAddress}
                            onToggleLedgerDialog={this._onToggleLedgerDialog.bind(this)}
                            onAddToken={this._onAddToken.bind(this)}
                            onRemoveToken={this._onRemoveToken.bind(this)}
                            refetchTokenStateAsync={this._refetchTokenStateAsync.bind(this)}
                            toggleTooltipDirection={
                                this.props.isPortalOnboardingShowing ? PointerDirection.Left : PointerDirection.Right
                            }
                        />
                    </Container>
                    {!isMobile && <Container marginTop="8px">{this._renderStartOnboarding()}</Container>}
                </Container>
                <PortalOnboardingFlow
                    blockchain={this._blockchain}
                    trackedTokenStateByAddress={this.state.trackedTokenStateByAddress}
                    refetchTokenStateAsync={this._refetchTokenStateAsync.bind(this)}
                />
            </div>
        );
    }
    private _renderStartOnboarding(): React.ReactNode {
        const isMobile = utils.isMobileWidth(this.props.screenWidth);
        const shouldStartOnboarding = !isMobile || this.props.location.pathname === `${WebsitePaths.Portal}/account`;
        const startOnboarding = (
            <Container className="flex items-center center">
                <Text fontColor={colors.mediumBlue} fontSize="16px" onClick={this._startOnboarding.bind(this)}>
                    Set up your account to start trading
                </Text>
                <Container marginLeft="8px" paddingTop="3px">
                    <Image src="/images/setup_account_icon.svg" height="20px" width="20x" />
                </Container>
            </Container>
        );
        return !shouldStartOnboarding ? (
            <Link to={`${WebsitePaths.Portal}/account`}>{startOnboarding}</Link>
        ) : (
            startOnboarding
        );
    }
    private _startOnboarding(): void {
        analytics.track('Onboarding Started', {
            reason: 'manual',
            stepIndex: this.props.portalOnboardingStep,
        });
        this.props.dispatcher.updatePortalOnboardingShowing(true);
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
                headerText: this._isSmallScreen() ? undefined : 'Your Account',
                render: this._isSmallScreen() ? this._renderWallet.bind(this) : this._renderTokenBalances.bind(this),
            },
            {
                pathName: `${WebsitePaths.Portal}/trades`,
                headerText: 'Trade History',
                render: this._renderTradeHistory.bind(this),
            },
            {
                pathName: `${WebsitePaths.Portal}/generate`,
                headerText: 'Generate Order',
                render: this._renderGenerateOrderForm.bind(this),
            },
            {
                pathName: `${WebsitePaths.Portal}/fill`,
                headerText: 'Fill Order',
                render: this._renderFillOrder.bind(this),
            },
        ];
        return (
            <div>
                <Switch>
                    {_.map(accountManagementItems, item => {
                        return (
                            <Route
                                key={item.pathName}
                                path={item.pathName}
                                render={this._renderAccountManagementItem.bind(this, item)}
                            />
                        );
                    })}
                    }
                    <Route render={this._renderNotFoundMessage.bind(this)} />
                </Switch>
                <PortalDisclaimerDialog
                    isOpen={this.state.isDisclaimerDialogOpen}
                    onToggleDialog={this._onPortalDisclaimerAccepted.bind(this)}
                />
            </div>
        );
    }
    private _renderAccountManagementItem(item: AccountManagementItem): React.ReactNode {
        return (
            <Section
                header={item.headerText !== undefined && <TextHeader labelText={item.headerText} />}
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
                isFullWidth={true}
            />
        );
    }
    private _renderTradeHistory(): React.ReactNode {
        return (
            <TradeHistory
                tokenByAddress={this.props.tokenByAddress}
                userAddress={this.props.userAddress}
                networkId={this.props.networkId}
                isFullWidth={true}
                shouldHideHeader={true}
                isScrollable={false}
            />
        );
    }
    private _renderGenerateOrderForm(): React.ReactNode {
        return (
            <GenerateOrderForm
                blockchain={this._blockchain}
                hashData={this.props.hashData}
                dispatcher={this.props.dispatcher}
                isFullWidth={true}
                shouldHideHeader={true}
            />
        );
    }
    private _renderFillOrder(): React.ReactNode {
        const initialFillOrder =
            this.props.userSuppliedOrderCache !== undefined
                ? this.props.userSuppliedOrderCache
                : this._sharedOrderIfExists;
        return (
            <FillOrder
                blockchain={this._blockchain}
                blockchainErr={this.props.blockchainErr}
                initialOrder={initialFillOrder}
                isOrderInUrl={this._sharedOrderIfExists !== undefined}
                orderFillAmount={this.props.orderFillAmount}
                networkId={this.props.networkId}
                userAddress={this.props.userAddress}
                tokenByAddress={this.props.tokenByAddress}
                dispatcher={this.props.dispatcher}
                lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                isFullWidth={true}
                shouldHideHeader={true}
            />
        );
    }
    private _renderTokenBalances(): React.ReactNode {
        return (
            <TokenBalances
                blockchain={this._blockchain}
                blockchainErr={this.props.blockchainErr}
                blockchainIsLoaded={this.props.blockchainIsLoaded}
                dispatcher={this.props.dispatcher}
                screenWidth={this.props.screenWidth}
                tokenByAddress={this.props.tokenByAddress}
                trackedTokens={this._getCurrentTrackedTokens()}
                userAddress={this.props.userAddress}
                userEtherBalanceInWei={this.props.userEtherBalanceInWei}
                networkId={this.props.networkId}
                lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                isFullWidth={true}
            />
        );
    }
    private _renderRelayerIndexSection(): React.ReactNode {
        const isMobile = utils.isMobileWidth(this.props.screenWidth);
        // TODO(bmillman): revert RelayerIndex cellStyle to Expanded once data pipeline is tracking v2 volume
        return (
            <Section
                header={!isMobile && <TextHeader labelText="0x Relayers" />}
                body={
                    <Container className="flex flex-column">
                        {isMobile && (
                            <Container marginTop="20px" marginBottom="20px">
                                {this._renderStartOnboarding()}
                            </Container>
                        )}
                        <RelayerIndex
                            networkId={this.props.networkId}
                            screenWidth={this.props.screenWidth}
                            cellStyle={RelayerIndexCellStyle.Minimized}
                        />
                    </Container>
                }
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
                const newToken: Token = {
                    ...token,
                    trackedTimestamp: undefined,
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
    private _getCurrentTrackedTokens(): Token[] {
        return utils.getTrackedTokens(this.props.tokenByAddress);
    }
    private _getCurrentTrackedTokensAddresses(): string[] {
        return _.map(this._getCurrentTrackedTokens(), token => token.address);
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

    private async _fetchBalancesAndAllowancesAsync(tokenAddresses: string[]): Promise<void> {
        if (_.isEmpty(tokenAddresses)) {
            return;
        }
        const trackedTokenStateByAddress = this.state.trackedTokenStateByAddress;
        const userAddressIfExists = _.isEmpty(this.props.userAddress) ? undefined : this.props.userAddress;
        const balancesAndAllowances = await Promise.all(
            tokenAddresses.map(async tokenAddress => {
                return this._blockchain.getTokenBalanceAndAllowanceAsync(userAddressIfExists, tokenAddress);
            }),
        );
        const priceByAddress = await this._getPriceByAddressAsync(tokenAddresses);
        for (let i = 0; i < tokenAddresses.length; i++) {
            // Order is preserved in Promise.all
            const [balance, allowance] = balancesAndAllowances[i];
            const tokenAddress = tokenAddresses[i];
            trackedTokenStateByAddress[tokenAddress] = {
                balance,
                allowance,
                isLoaded: true,
                price: priceByAddress[tokenAddress],
            };
        }
        this.setState({
            trackedTokenStateByAddress,
        });
    }

    private async _getPriceByAddressAsync(tokenAddresses: string[]): Promise<ItemByAddress<BigNumber>> {
        if (_.isEmpty(tokenAddresses)) {
            return {};
        }
        // for each input token address, search for the corresponding symbol in this.props.tokenByAddress, if it exists
        // create a mapping from existing symbols -> address
        const tokenAddressBySymbol: { [symbol: string]: string } = {};
        _.each(tokenAddresses, address => {
            const tokenIfExists = _.get(this.props.tokenByAddress, address);
            if (tokenIfExists !== undefined) {
                const symbol = tokenIfExists.symbol;
                tokenAddressBySymbol[symbol] = address;
            }
        });
        const tokenSymbols = _.keys(tokenAddressBySymbol);
        try {
            const priceBySymbol = await backendClient.getPriceInfoAsync(tokenSymbols);
            const priceByAddress = _.mapKeys(priceBySymbol, (_value, symbol) => _.get(tokenAddressBySymbol, symbol));
            const result = _.mapValues(priceByAddress, price => {
                const priceBigNumber = new BigNumber(price);
                return priceBigNumber;
            });
            return result;
        } catch (err) {
            return {};
        }
    }

    private async _refetchTokenStateAsync(tokenAddress: string): Promise<void> {
        await this._fetchBalancesAndAllowancesAsync([tokenAddress]);
    }
}

interface LargeLayoutProps {
    left: React.ReactNode;
    right: React.ReactNode;
}
const LargeLayout = (props: LargeLayoutProps) => {
    return (
        <Container
            className="mx-auto flex flex-center"
            maxWidth={LARGE_LAYOUT_MAX_WIDTH}
            paddingLeft={SIDE_PADDING}
            paddingRight={SIDE_PADDING}
        >
            <div className="flex-last">
                <Container width={LEFT_COLUMN_WIDTH} position="fixed" zIndex={zIndex.aboveTopBar}>
                    {props.left}
                </Container>
            </div>
            <Container className="flex-auto" marginLeft={LEFT_COLUMN_WIDTH}>
                <Container className="flex-auto" marginLeft={SIDE_PADDING}>
                    {props.right}
                </Container>
            </Container>
        </Container>
    );
};

interface SmallLayoutProps {
    content: React.ReactNode;
}
const SmallLayout = (props: SmallLayoutProps) => {
    return (
        <div className="flex flex-center">
            <Container className="flex-auto" paddingLeft={SIDE_PADDING} paddingRight={SIDE_PADDING}>
                {props.content}
            </Container>
        </div>
    );
}; // tslint:disable:max-file-line-count
