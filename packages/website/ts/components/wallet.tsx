import { ZeroEx } from '0x.js';
import {
    constants as sharedConstants,
    EtherscanLinkSuffixes,
    Styles,
    utils as sharedUtils,
} from '@0xproject/react-shared';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import FlatButton from 'material-ui/FlatButton';
import { List, ListItem } from 'material-ui/List';
import NavigationArrowDownward from 'material-ui/svg-icons/navigation/arrow-downward';
import NavigationArrowUpward from 'material-ui/svg-icons/navigation/arrow-upward';
import * as React from 'react';
import ReactTooltip = require('react-tooltip');
import firstBy = require('thenby');

import { Blockchain } from 'ts/blockchain';
import { AllowanceToggle } from 'ts/components/inputs/allowance_toggle';
import { Identicon } from 'ts/components/ui/identicon';
import { TokenIcon } from 'ts/components/ui/token_icon';
import { Dispatcher } from 'ts/redux/dispatcher';
import { BalanceErrs, BlockchainErrs, Token, TokenByAddress } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

export interface WalletProps {
    userAddress?: string;
    networkId?: number;
    blockchain?: Blockchain;
    blockchainIsLoaded: boolean;
    blockchainErr: BlockchainErrs;
    dispatcher: Dispatcher;
    tokenByAddress: TokenByAddress;
    trackedTokens: Token[];
    userEtherBalanceInWei: BigNumber;
    lastForceTokenStateRefetch: number;
}

interface WalletState {
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

enum WrappedEtherAction {
    Wrap,
    Unwrap,
}

interface AllowanceToggleConfig {
    token: Token;
    tokenState: TokenState;
}

interface AccessoryItemConfig {
    wrappedEtherAction?: WrappedEtherAction;
    allowanceToggleConfig?: AllowanceToggleConfig;
}

const styles: Styles = {
    wallet: {
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
    tokenItemInnerDiv: {
        paddingLeft: 60,
    },
    headerItemInnerDiv: {
        paddingLeft: 65,
    },
    footerItemInnerDiv: {
        paddingLeft: 24,
    },
    borderedItem: {
        borderBottomColor: '#f5f5f6',
        borderBottomStyle: 'solid',
        borderWidth: 1,
    },
    tokenItem: {
        backgroundColor: '#fbfbfc',
        paddingTop: 8,
        paddingBottom: 8,
    },
    headerItem: {
        paddingTop: 8,
        paddingBottom: 8,
    },
    wrappedEtherButtonLabel: {
        fontSize: 12,
    },
    amountLabel: {
        fontWeight: 'bold',
        color: 'black',
    },
};

const ETHER_ICON_PATH = '/images/ether.png';
const ETHER_TOKEN_SYMBOL = 'WETH';
const ZRX_TOKEN_SYMBOL = 'ZRX';
const ETHER_SYMBOL = 'ETH';
const ICON_DIMENSION = 24;
const TOKEN_AMOUNT_DISPLAY_PRECISION = 3;

export class Wallet extends React.Component<WalletProps, WalletState> {
    private _isUnmounted: boolean;
    constructor(props: WalletProps) {
        super(props);
        this._isUnmounted = false;
        const initialTrackedTokenStateByAddress = this._getInitialTrackedTokenStateByAddress(props.trackedTokens);
        this.state = {
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
    public render() {
        const isReadyToRender = this.props.blockchainIsLoaded && this.props.blockchainErr === BlockchainErrs.NoError;
        return <div style={styles.wallet}>{isReadyToRender ? this._renderRows() : <div />}</div>;
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
        const primaryText = utils.getAddressBeginAndEnd(userAddress);
        return (
            <ListItem
                primaryText={primaryText}
                leftIcon={<Identicon address={userAddress} diameter={ICON_DIMENSION} />}
                style={{ ...styles.headerItem, ...styles.borderedItem }}
                innerDivStyle={styles.headerItemInnerDiv}
            />
        );
    }
    private _renderFooterRows() {
        const primaryText = '+ other tokens';
        return (
            <ListItem primaryText={primaryText} style={styles.borderedItem} innerDivStyle={styles.footerItemInnerDiv} />
        );
    }
    private _renderEthRows() {
        const primaryText = this._renderAmount(
            this.props.userEtherBalanceInWei,
            constants.DECIMAL_PLACES_ETH,
            ETHER_SYMBOL,
        );
        const accessoryItemConfig = {
            wrappedEtherAction: WrappedEtherAction.Wrap,
        };
        return (
            <ListItem
                primaryText={primaryText}
                leftIcon={<img style={{ width: ICON_DIMENSION, height: ICON_DIMENSION }} src={ETHER_ICON_PATH} />}
                rightAvatar={this._renderAccessoryItems(accessoryItemConfig)}
                style={{ ...styles.tokenItem, ...styles.borderedItem }}
                innerDivStyle={styles.tokenItemInnerDiv}
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
        return _.map(trackedTokensStartingWithEtherToken, this._renderTokenRow.bind(this));
    }
    private _renderTokenRow(token: Token) {
        const tokenState = this.state.trackedTokenStateByAddress[token.address];
        const tokenLink = sharedUtils.getEtherScanLinkIfExists(
            token.address,
            this.props.networkId,
            EtherscanLinkSuffixes.Address,
        );
        const amount = this._renderAmount(tokenState.balance, token.decimals, token.symbol);
        const wrappedEtherAction = token.symbol === ETHER_TOKEN_SYMBOL ? WrappedEtherAction.Unwrap : undefined;
        const accessoryItemConfig: AccessoryItemConfig = {
            wrappedEtherAction,
            allowanceToggleConfig: {
                token,
                tokenState,
            },
        };
        return (
            <ListItem
                primaryText={amount}
                leftIcon={this._renderTokenIcon(token, tokenLink)}
                rightAvatar={this._renderAccessoryItems(accessoryItemConfig)}
                style={{ ...styles.tokenItem, ...styles.borderedItem }}
                innerDivStyle={styles.tokenItemInnerDiv}
            />
        );
    }
    private _renderAccessoryItems(config: AccessoryItemConfig) {
        const shouldShowWrappedEtherAction = !_.isUndefined(config.wrappedEtherAction);
        const shouldShowToggle = !_.isUndefined(config.allowanceToggleConfig);
        return (
            <div style={{ width: 160 }}>
                <div className="flex">
                    <div className="flex-auto">
                        {shouldShowWrappedEtherAction && this._renderWrappedEtherButton(config.wrappedEtherAction)}
                    </div>
                    <div className="flex-last py1">
                        {shouldShowToggle && this._renderAllowanceToggle(config.allowanceToggleConfig)}
                    </div>
                </div>
            </div>
        );
    }
    private _renderAllowanceToggle(config: AllowanceToggleConfig) {
        return (
            <AllowanceToggle
                networkId={this.props.networkId}
                blockchain={this.props.blockchain}
                dispatcher={this.props.dispatcher}
                token={config.token}
                tokenState={config.tokenState}
                onErrorOccurred={_.noop} // TODO: Error handling
                userAddress={this.props.userAddress}
                isDisabled={!config.tokenState.isLoaded}
                refetchTokenStateAsync={this._refetchTokenStateAsync.bind(this, config.token.address)}
            />
        );
    }
    private _renderAmount(amount: BigNumber, decimals: number, symbol: string) {
        const unitAmount = ZeroEx.toUnitAmount(amount, decimals);
        const formattedAmount = unitAmount.toPrecision(TOKEN_AMOUNT_DISPLAY_PRECISION);
        const result = `${formattedAmount} ${symbol}`;
        return <div style={styles.amountLabel}>{result}</div>;
    }
    private _renderTokenIcon(token: Token, tokenLink?: string) {
        const tooltipId = `tooltip-${token.address}`;
        const tokenIcon = <TokenIcon token={token} diameter={ICON_DIMENSION} />;
        if (_.isUndefined(tokenLink)) {
            return tokenIcon;
        } else {
            return (
                <a href={tokenLink} target="_blank" style={{ textDecoration: 'none' }}>
                    {tokenIcon}
                </a>
            );
        }
    }
    private _renderWrappedEtherButton(action: WrappedEtherAction) {
        let buttonLabel;
        let buttonIcon;
        switch (action) {
            case WrappedEtherAction.Wrap:
                buttonLabel = 'wrap';
                buttonIcon = <NavigationArrowDownward />;
                break;
            case WrappedEtherAction.Unwrap:
                buttonLabel = 'unwrap';
                buttonIcon = <NavigationArrowUpward />;
                break;
            default:
                throw utils.spawnSwitchErr('wrappedEtherAction', action);
        }
        return (
            <FlatButton
                label={buttonLabel}
                labelPosition="after"
                primary={true}
                icon={buttonIcon}
                labelStyle={styles.wrappedEtherButtonLabel}
            />
        );
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
}
