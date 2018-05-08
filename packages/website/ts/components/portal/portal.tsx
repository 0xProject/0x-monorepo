import { colors, Styles } from '@0xproject/react-shared';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as React from 'react';
import * as DocumentTitle from 'react-document-title';

import { Blockchain } from 'ts/blockchain';
import { BlockchainErrDialog } from 'ts/components/dialogs/blockchain_err_dialog';
import { LedgerConfigDialog } from 'ts/components/dialogs/ledger_config_dialog';
import { PortalDisclaimerDialog } from 'ts/components/dialogs/portal_disclaimer_dialog';
import { RelayerIndex } from 'ts/components/relayer_index/relayer_index';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { FlashMessage } from 'ts/components/ui/flash_message';
import { Wallet } from 'ts/components/wallet/wallet';
import { localStorage } from 'ts/local_storage/local_storage';
import { Dispatcher } from 'ts/redux/dispatcher';
import { BlockchainErrs, HashData, Order, ProviderType, ScreenWidths, TokenByAddress } from 'ts/types';
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
}

const THROTTLE_TIMEOUT = 100;
const TOP_BAR_HEIGHT = 60;

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
        overflowZ: 'hidden',
        height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
        WebkitOverflowScrolling: 'touch',
        overflow: 'auto',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 20,
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
            isLedgerDialogOpen: false,
        };
    }
    public componentDidMount() {
        window.addEventListener('resize', this._throttledScreenWidthUpdate);
        window.scrollTo(0, 0);
    }
    public componentWillMount() {
        this._blockchain = new Blockchain(this.props.dispatcher);
    }
    public componentWillUnmount() {
        this._blockchain.destroy();
        window.removeEventListener('resize', this._throttledScreenWidthUpdate);
        // We re-set the entire redux state when the portal is unmounted so that when it is re-rendered
        // the initialization process always occurs from the same base state. This helps avoid
        // initialization inconsistencies (i.e While the portal was unrendered, the user might have
        // become disconnected from their backing Ethereum node, changes user accounts, etc...)
        this.props.dispatcher.resetState();
    }
    public componentWillReceiveProps(nextProps: PortalProps) {
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
    public render() {
        const updateShouldBlockchainErrDialogBeOpen = this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen.bind(
            this.props.dispatcher,
        );
        const allTokens = _.values(this.props.tokenByAddress);
        const trackedTokens = _.filter(allTokens, t => t.isTracked);
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
                    style={{ backgroundColor: colors.lightestGrey }}
                />
                <div id="portal" style={styles.body}>
                    <div className="sm-flex flex-center">
                        <div className="flex-last px3">
                            <div className="py3" style={styles.title}>
                                Your Account
                            </div>
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
                            />
                        </div>
                        <div className="flex-auto px3" style={styles.scrollContainer}>
                            <div className="py3" style={styles.title}>
                                Explore 0x Ecosystem
                            </div>
                            <RelayerIndex networkId={this.props.networkId} />
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
                </div>
            </div>
        );
    }
    private _onToggleLedgerDialog() {
        this.setState({
            isLedgerDialogOpen: !this.state.isLedgerDialogOpen,
        });
    }
    private _onPortalDisclaimerAccepted() {
        localStorage.setItem(constants.LOCAL_STORAGE_KEY_ACCEPT_DISCLAIMER, 'set');
        this.setState({
            isDisclaimerDialogOpen: false,
        });
    }
    private _updateScreenWidth() {
        const newScreenWidth = utils.getScreenWidth();
        this.props.dispatcher.updateScreenWidth(newScreenWidth);
    }
}
