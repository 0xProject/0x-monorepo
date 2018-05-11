import { colors } from '@0xproject/react-shared';
import { BigNumber, logUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import Paper from 'material-ui/Paper';
import * as React from 'react';
import * as DocumentTitle from 'react-document-title';
import { Route, Switch } from 'react-router-dom';
import { Blockchain } from 'ts/blockchain';
import { BlockchainErrDialog } from 'ts/components/dialogs/blockchain_err_dialog';
import { LedgerConfigDialog } from 'ts/components/dialogs/ledger_config_dialog';
import { PortalDisclaimerDialog } from 'ts/components/dialogs/portal_disclaimer_dialog';
import { WrappedEthSectionNoticeDialog } from 'ts/components/dialogs/wrapped_eth_section_notice_dialog';
import { EthWrappers } from 'ts/components/eth_wrappers';
import { FillOrder } from 'ts/components/fill_order';
import { Footer } from 'ts/components/footer';
import { LegacyPortalMenu } from 'ts/components/legacy_portal/legacy_portal_menu';
import { RelayerIndex } from 'ts/components/relayer_index/relayer_index';
import { TokenBalances } from 'ts/components/token_balances';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { TradeHistory } from 'ts/components/trade_history/trade_history';
import { FlashMessage } from 'ts/components/ui/flash_message';
import { Wallet } from 'ts/components/wallet/wallet';
import { GenerateOrderForm } from 'ts/containers/generate_order_form';
import { localStorage } from 'ts/local_storage/local_storage';
import { Dispatcher } from 'ts/redux/dispatcher';
import { portalOrderSchema } from 'ts/schemas/portal_order_schema';
import { validator } from 'ts/schemas/validator';
import {
    BlockchainErrs,
    Environments,
    HashData,
    Order,
    ProviderType,
    ScreenWidths,
    TokenByAddress,
    WebsitePaths,
} from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

const THROTTLE_TIMEOUT = 100;

export interface LegacyPortalProps {
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

interface LegacyPortalState {
    prevNetworkId: number;
    prevNodeVersion: string;
    prevUserAddress: string;
    prevPathname: string;
    isDisclaimerDialogOpen: boolean;
    isWethNoticeDialogOpen: boolean;
    isLedgerDialogOpen: boolean;
}

export class LegacyPortal extends React.Component<LegacyPortalProps, LegacyPortalState> {
    private _blockchain: Blockchain;
    private _sharedOrderIfExists: Order;
    private _throttledScreenWidthUpdate: () => void;
    public static hasAlreadyDismissedWethNotice(): boolean {
        const didDismissWethNotice = localStorage.getItemIfExists(constants.LOCAL_STORAGE_KEY_DISMISS_WETH_NOTICE);
        const hasAlreadyDismissedWethNotice = !_.isUndefined(didDismissWethNotice) && !_.isEmpty(didDismissWethNotice);
        return hasAlreadyDismissedWethNotice;
    }
    constructor(props: LegacyPortalProps) {
        super(props);
        this._sharedOrderIfExists = this._getSharedOrderIfExists();
        this._throttledScreenWidthUpdate = _.throttle(this._updateScreenWidth.bind(this), THROTTLE_TIMEOUT);

        const isViewingBalances = _.includes(props.location.pathname, `${WebsitePaths.Portal}/balances`);
        const hasAlreadyDismissedWethNotice = LegacyPortal.hasAlreadyDismissedWethNotice();

        const didAcceptPortalDisclaimer = localStorage.getItemIfExists(constants.LOCAL_STORAGE_KEY_ACCEPT_DISCLAIMER);
        const hasAcceptedDisclaimer =
            !_.isUndefined(didAcceptPortalDisclaimer) && !_.isEmpty(didAcceptPortalDisclaimer);
        this.state = {
            prevNetworkId: this.props.networkId,
            prevNodeVersion: this.props.nodeVersion,
            prevUserAddress: this.props.userAddress,
            prevPathname: this.props.location.pathname,
            isDisclaimerDialogOpen: !hasAcceptedDisclaimer,
            isWethNoticeDialogOpen: !hasAlreadyDismissedWethNotice && isViewingBalances,
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
        // become disconnected from their backing Ethereum node, changes user accounts, etc...)
        this.props.dispatcher.resetState();
    }
    public componentWillReceiveProps(nextProps: LegacyPortalProps): void {
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
            const isViewingBalances = _.includes(nextProps.location.pathname, `${WebsitePaths.Portal}/balances`);
            const hasAlreadyDismissedWethNotice = LegacyPortal.hasAlreadyDismissedWethNotice();
            this.setState({
                prevPathname: nextProps.location.pathname,
                isWethNoticeDialogOpen: !hasAlreadyDismissedWethNotice && isViewingBalances,
            });
        }
    }
    public render(): React.ReactNode {
        const updateShouldBlockchainErrDialogBeOpen = this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen.bind(
            this.props.dispatcher,
        );
        const portalStyle: React.CSSProperties = {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
        };
        const portalMenuContainerStyle: React.CSSProperties = {
            overflow: 'hidden',
            backgroundColor: colors.darkestGrey,
            color: colors.white,
        };
        return (
            <div style={portalStyle}>
                <DocumentTitle title="0x Portal DApp" />
                <TopBar
                    userAddress={this.props.userAddress}
                    networkId={this.props.networkId}
                    injectedProviderName={this.props.injectedProviderName}
                    onToggleLedgerDialog={this.onToggleLedgerDialog.bind(this)}
                    dispatcher={this.props.dispatcher}
                    providerType={this.props.providerType}
                    blockchainIsLoaded={this.props.blockchainIsLoaded}
                    location={this.props.location}
                    blockchain={this._blockchain}
                    translate={this.props.translate}
                />
                <div id="portal" className="mx-auto max-width-4" style={{ width: '100%' }}>
                    <Paper className="mb3 mt2">
                        {!configs.IS_MAINNET_ENABLED && this.props.networkId === constants.NETWORK_ID_MAINNET ? (
                            <div className="p3 center">
                                <div className="h2 py2">Mainnet unavailable</div>
                                <div className="mx-auto pb2 pt2">
                                    <img src="/images/zrx_token.png" style={{ width: 150 }} />
                                </div>
                                <div>
                                    0x portal is currently unavailable on the Ethereum mainnet.
                                    <div>To try it out, switch to the Kovan test network (networkId: 42).</div>
                                    <div className="py2">Check back soon!</div>
                                </div>
                            </div>
                        ) : (
                            <div className="mx-auto flex">
                                <div className="col col-2 pr2 pt1 sm-hide xs-hide" style={portalMenuContainerStyle}>
                                    <LegacyPortalMenu menuItemStyle={{ color: colors.white }} />
                                </div>
                                <div className="col col-12 lg-col-10 md-col-10 sm-col sm-col-12">
                                    <div className="py2" style={{ backgroundColor: colors.grey50 }}>
                                        {this.props.blockchainIsLoaded ? (
                                            <Switch>
                                                <Route
                                                    path={`${WebsitePaths.Portal}/weth`}
                                                    render={this._renderEthWrapper.bind(this)}
                                                />
                                                <Route
                                                    path={`${WebsitePaths.Portal}/fill`}
                                                    render={this._renderFillOrder.bind(this)}
                                                />
                                                <Route
                                                    path={`${WebsitePaths.Portal}/balances`}
                                                    render={this._renderTokenBalances.bind(this)}
                                                />
                                                <Route
                                                    path={`${WebsitePaths.Portal}/trades`}
                                                    component={this._renderTradeHistory.bind(this)}
                                                />
                                                <Route
                                                    path={`${WebsitePaths.Home}`}
                                                    render={this._renderGenerateOrderForm.bind(this)}
                                                />
                                            </Switch>
                                        ) : (
                                            <div className="pt4 sm-px2 sm-pt2 sm-m1" style={{ height: 500 }}>
                                                <div
                                                    className="relative sm-px2 sm-pt2 sm-m1"
                                                    style={{ height: 122, top: '50%', transform: 'translateY(-50%)' }}
                                                >
                                                    <div className="center pb2">
                                                        <CircularProgress size={40} thickness={5} />
                                                    </div>
                                                    <div className="center pt2" style={{ paddingBottom: 11 }}>
                                                        Loading Portal...
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Paper>
                    <BlockchainErrDialog
                        blockchain={this._blockchain}
                        blockchainErr={this.props.blockchainErr}
                        isOpen={this.props.shouldBlockchainErrDialogBeOpen}
                        userAddress={this.props.userAddress}
                        toggleDialogFn={updateShouldBlockchainErrDialogBeOpen}
                        networkId={this.props.networkId}
                    />
                    <WrappedEthSectionNoticeDialog
                        isOpen={this.state.isWethNoticeDialogOpen}
                        onToggleDialog={this._onWethNoticeAccepted.bind(this)}
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
                            toggleDialogFn={this.onToggleLedgerDialog.bind(this)}
                            isOpen={this.state.isLedgerDialogOpen}
                        />
                    )}
                </div>
                <Footer translate={this.props.translate} dispatcher={this.props.dispatcher} />
            </div>
        );
    }
    public onToggleLedgerDialog(): void {
        this.setState({
            isLedgerDialogOpen: !this.state.isLedgerDialogOpen,
        });
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
    private _renderFillOrder(match: any, location: Location, history: History): React.ReactNode {
        const initialFillOrder = !_.isUndefined(this.props.userSuppliedOrderCache)
            ? this.props.userSuppliedOrderCache
            : this._sharedOrderIfExists;
        return (
            <FillOrder
                blockchain={this._blockchain}
                blockchainErr={this.props.blockchainErr}
                initialOrder={initialFillOrder}
                isOrderInUrl={!_.isUndefined(this._sharedOrderIfExists)}
                orderFillAmount={this.props.orderFillAmount}
                networkId={this.props.networkId}
                userAddress={this.props.userAddress}
                tokenByAddress={this.props.tokenByAddress}
                dispatcher={this.props.dispatcher}
                lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
            />
        );
    }
    private _renderGenerateOrderForm(match: any, location: Location, history: History): React.ReactNode {
        return (
            <GenerateOrderForm
                blockchain={this._blockchain}
                hashData={this.props.hashData}
                dispatcher={this.props.dispatcher}
            />
        );
    }
    private _onPortalDisclaimerAccepted(): void {
        localStorage.setItem(constants.LOCAL_STORAGE_KEY_ACCEPT_DISCLAIMER, 'set');
        this.setState({
            isDisclaimerDialogOpen: false,
        });
    }
    private _onWethNoticeAccepted(): void {
        localStorage.setItem(constants.LOCAL_STORAGE_KEY_DISMISS_WETH_NOTICE, 'set');
        this.setState({
            isWethNoticeDialogOpen: false,
        });
    }
    private _getSharedOrderIfExists(): Order | undefined {
        const queryString = window.location.search;
        if (queryString.length === 0) {
            return undefined;
        }
        const queryParams = queryString.substring(1).split('&');
        const orderQueryParam = _.find(queryParams, queryParam => {
            const queryPair = queryParam.split('=');
            return queryPair[0] === 'order';
        });
        if (_.isUndefined(orderQueryParam)) {
            return undefined;
        }
        const orderPair = orderQueryParam.split('=');
        if (orderPair.length !== 2) {
            return undefined;
        }

        const order = JSON.parse(decodeURIComponent(orderPair[1]));
        const validationResult = validator.validate(order, portalOrderSchema);
        if (validationResult.errors.length > 0) {
            logUtils.log(`Invalid shared order: ${validationResult.errors}`);
            return undefined;
        }
        return order;
    }
    private _updateScreenWidth(): void {
        const newScreenWidth = utils.getScreenWidth();
        this.props.dispatcher.updateScreenWidth(newScreenWidth);
    }
}
