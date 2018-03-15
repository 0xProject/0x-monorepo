import { ZeroEx } from '0x.js';
import {
    colors,
    constants as sharedConstants,
    EtherscanLinkSuffixes,
    MarkdownSection,
    MenuSubsectionsBySection,
    NestedSidebarMenu,
    Networks,
    SectionHeader,
    Styles,
    utils as sharedUtils,
} from '@0xproject/react-shared';
import { BigNumber, logUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import * as React from 'react';
import ReactTooltip = require('react-tooltip');
import firstBy = require('thenby');

import { blue500, yellow600 } from 'material-ui/styles/colors';
import ActionAssignment from 'material-ui/svg-icons/action/assignment';
import ActionInfo from 'material-ui/svg-icons/action/info';
import EditorInsertChart from 'material-ui/svg-icons/editor/insert-chart';
import FileFolder from 'material-ui/svg-icons/file/folder';

import AppBar from 'material-ui/AppBar';
import Avatar from 'material-ui/Avatar';
import { List, ListItem } from 'material-ui/List';
import Paper from 'material-ui/Paper';
import { MuiThemeProvider } from 'material-ui/styles';
import Subheader from 'material-ui/Subheader';
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui/Table';
import Toggle from 'material-ui/Toggle';

import CommunicationChatBubble from 'material-ui/svg-icons/communication/chat-bubble';
import { Tab, Tabs } from 'material-ui/Tabs';

import { Blockchain } from 'ts/blockchain';
import { AllowanceToggle } from 'ts/components/inputs/allowance_toggle';
import { HelpTooltip } from 'ts/components/ui/help_tooltip';
import { Identicon } from 'ts/components/ui/identicon';
import { LifeCycleRaisedButton } from 'ts/components/ui/lifecycle_raised_button';
import { TokenIcon } from 'ts/components/ui/token_icon';
import { Dispatcher } from 'ts/redux/dispatcher';
import {
    BalanceErrs,
    BlockchainCallErrs,
    BlockchainErrs,
    ProviderType,
    ScreenWidths,
    Token,
    TokenByAddress,
} from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';

import { muiTheme } from '../utils/mui_theme';

export interface WalletProps {
    userAddress?: string;
    networkId?: number;
    injectedProviderName?: string;
    providerType?: ProviderType;
    blockchain?: Blockchain;
    blockchainIsLoaded: boolean;
    blockchainErr: BlockchainErrs;
    dispatcher: Dispatcher;
    screenWidth: ScreenWidths;
    tokenByAddress: TokenByAddress;
    trackedTokens: Token[];
    userEtherBalanceInWei: BigNumber;
    lastForceTokenStateRefetch: number;
}

interface WalletState {
    errorType: BalanceErrs;
    isBalanceSpinnerVisible: boolean;
    isZRXSpinnerVisible: boolean;
    isTokenPickerOpen: boolean;
    isAddingToken: boolean;
    trackedTokenStateByAddress: TokenStateByAddress;
}

interface TokenStateByAddress {
    [address: string]: TokenState;
}

interface TokenState {
    balance: BigNumber;
    allowance: BigNumber;
    isLoaded: boolean;
}

const styles: Styles = {
    wallet: {
        height: 500,
        width: 346,
        backgroundColor: '#ffffff',
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        boxShadow: '0px 4px 6px rgba(56, 59, 137, 0.2)',
        overflow: 'hidden',
    },
    list: {
        padding: '0px 0px 0px 0px',
    },
    headerItem: {
        borderBottomColor: '#f5f5f6',
        borderBottomStyle: 'solid',
        borderWidth: 1,
    },
    footerItem: {
        borderBottomColor: '#f5f5f6',
        borderBottomStyle: 'solid',
        borderWidth: 1,
    },
    tokenItem: {
        backgroundColor: '#fbfbfc',
        paddingTop: 8,
        paddingBottom: 8,
        borderBottomColor: '#f5f5f6',
        borderBottomStyle: 'solid',
        borderWidth: 1,
    },
    listDivider: {
        color: '#000000',
    },
};

const ETHER_ICON_PATH = '/images/ether.png';
const ETHER_TOKEN_SYMBOL = 'WETH';
const ZRX_TOKEN_SYMBOL = 'ZRX';

const TOKEN_ICON_DIMENSION = 30;
const IDENTICON_ICON_DIMENSION = 25;
const TOKEN_TABLE_ROW_HEIGHT = 100;
const MAX_TOKEN_TABLE_HEIGHT = 420;
const TOKEN_COL_SPAN_LG = 2;
const TOKEN_COL_SPAN_SM = 1;

const TOKEN_AMOUNT_DISPLAY_PRECISION = 3;

export class Wallet extends React.Component<WalletProps, WalletState> {
    private _isUnmounted: boolean;
    constructor(props: WalletProps) {
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
    public componentWillMount() {
        const trackedTokenAddresses = _.keys(this.state.trackedTokenStateByAddress);
        // tslint:disable-next-line:no-floating-promises
        this._fetchBalancesAndAllowancesAsync(trackedTokenAddresses);
    }
    public componentWillUnmount() {
        this._isUnmounted = true;
    }
    public componentWillReceiveProps(nextProps: WalletProps) {
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
    public componentDidMount() {
        window.scrollTo(0, 0);
    }
    public render() {
        // const isTestNetwork = utils.isTestNetwork(this.props.networkId);
        const allTokenRowHeight = _.size(this.props.tokenByAddress) * TOKEN_TABLE_ROW_HEIGHT;
        const tokenTableHeight =
            allTokenRowHeight < MAX_TOKEN_TABLE_HEIGHT ? allTokenRowHeight : MAX_TOKEN_TABLE_HEIGHT;
        const isReadyToRender = this.props.blockchainIsLoaded && this.props.blockchainErr === BlockchainErrs.NoError;
        return <div style={styles.wallet}>{isReadyToRender ? this._renderRows() : <div />}</div>;
    }
    private _getInitialTrackedTokenStateByAddress(trackedTokens: Token[]) {
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
    private async _fetchBalancesAndAllowancesAsync(tokenAddresses: string[]) {
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
    private _renderRows() {
        return (
            <List style={styles.list}>
                {_.concat(
                    this._renderHeaderRows(),
                    this._renderEthRows(),
                    this._renderTokenRows(),
                    this._renderFooterRows(),
                )}
            </List>
        );
    }
    private _renderHeaderRows() {
        const userAddress = this.props.userAddress;
        const primaryText = this._renderShortenedUserAddress(userAddress);
        return (
            <ListItem
                primaryText={primaryText}
                leftIcon={<Identicon address={userAddress} diameter={IDENTICON_ICON_DIMENSION} />}
                style={styles.footerItem}
            />
        );
    }
    private _renderFooterRows() {
        const primaryText = '+ other tokens';
        return <ListItem primaryText={primaryText} style={styles.footerItem} />;
    }
    private _renderEthRows() {
        const userEtherBalanceInEth = ZeroEx.toUnitAmount(
            this.props.userEtherBalanceInWei,
            constants.DECIMAL_PLACES_ETH,
        );
        const primaryText = `${userEtherBalanceInEth.toFixed(TOKEN_AMOUNT_DISPLAY_PRECISION)} ETH`;
        return (
            <ListItem
                primaryText={primaryText}
                secondaryText={'$100'}
                leftAvatar={
                    <img style={{ width: TOKEN_ICON_DIMENSION, height: TOKEN_ICON_DIMENSION }} src={ETHER_ICON_PATH} />
                }
                style={styles.tokenItem}
            />
        );
    }

    private _renderTokenRows() {
        const trackedTokens = this.props.trackedTokens;
        const trackedTokensStartingWithEtherToken = trackedTokens.sort(
            firstBy((t: Token) => t.symbol !== ETHER_TOKEN_SYMBOL)
                .thenBy((t: Token) => t.symbol !== ZRX_TOKEN_SYMBOL)
                .thenBy('address'),
        );
        const firstTwoTokens = _.slice(trackedTokensStartingWithEtherToken, 0, 2); // this is a hack
        return _.map(firstTwoTokens, this._renderTokenRow.bind(this));
    }
    private _renderTokenRow(token: Token) {
        const tokenState = this.state.trackedTokenStateByAddress[token.address];
        const tokenLink = sharedUtils.getEtherScanLinkIfExists(
            token.address,
            this.props.networkId,
            EtherscanLinkSuffixes.Address,
        );
        const amount = this._renderAmount(tokenState.balance, token.decimals);
        const primaryText = `${amount} ${token.symbol}`;
        return (
            <ListItem
                primaryText={primaryText}
                secondaryText={'$100'}
                leftAvatar={this._renderTokenName(token, tokenLink)}
                // rightIcon={this._renderAllowanceToggle(token, tokenState)}
                // rightIcon={<CommunicationChatBubble />}
                // rightToggle={<Toggle />}
                style={styles.tokenItem}
            />
        );
    }
    private _renderAllowanceToggle(token: Token, tokenState: TokenState) {
        return (
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
        );
    }
    private _renderAmount(amount: BigNumber, decimals: number) {
        const unitAmount = ZeroEx.toUnitAmount(amount, decimals);
        return unitAmount.toNumber().toFixed(TOKEN_AMOUNT_DISPLAY_PRECISION);
    }
    private _renderTokenName(token: Token, tokenLink?: string) {
        const tooltipId = `tooltip-${token.address}`;
        const renderTokenIcon = () => (
            <div className="flex">
                <TokenIcon token={token} diameter={TOKEN_ICON_DIMENSION} />
                <ReactTooltip id={tooltipId}>{token.address}</ReactTooltip>
            </div>
        );
        if (_.isUndefined(tokenLink)) {
            return renderTokenIcon();
        } else {
            return (
                <a href={tokenLink} target="_blank" style={{ textDecoration: 'none' }}>
                    {renderTokenIcon()}
                </a>
            );
        }
    }
    private async _refetchTokenStateAsync(tokenAddress: string) {
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
    private _onErrorOccurred(errorType: BalanceErrs) {
        this.setState({
            errorType,
        });
    }
    private _renderShortenedUserAddress(userAddress: string) {
        const shortenedUserAddress = userAddress.substring(0, 9);
        return `${shortenedUserAddress}...`;
    }
}
