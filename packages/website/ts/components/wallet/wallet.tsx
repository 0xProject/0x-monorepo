import { ZeroEx } from '0x.js';
import {
    colors,
    constants as sharedConstants,
    EtherscanLinkSuffixes,
    Styles,
    utils as sharedUtils,
} from '@0xproject/react-shared';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import FlatButton from 'material-ui/FlatButton';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import { List, ListItem } from 'material-ui/List';
import ActionAccountBalanceWallet from 'material-ui/svg-icons/action/account-balance-wallet';
import ContentAdd from 'material-ui/svg-icons/content/add';
import ContentRemove from 'material-ui/svg-icons/content/remove';
import NavigationArrowDownward from 'material-ui/svg-icons/navigation/arrow-downward';
import NavigationArrowUpward from 'material-ui/svg-icons/navigation/arrow-upward';
import Close from 'material-ui/svg-icons/navigation/close';
import * as React from 'react';
import ReactTooltip = require('react-tooltip');
import firstBy = require('thenby');

import { Blockchain } from 'ts/blockchain';
import { AllowanceToggle } from 'ts/components/inputs/allowance_toggle';
import { Identicon } from 'ts/components/ui/identicon';
import { TokenIcon } from 'ts/components/ui/token_icon';
import { WalletDisconnectedItem } from 'ts/components/wallet/wallet_disconnected_item';
import { WrapEtherItem } from 'ts/components/wallet/wrap_ether_item';
import { Dispatcher } from 'ts/redux/dispatcher';
import {
    BalanceErrs,
    BlockchainErrs,
    ItemByAddress,
    ProviderType,
    Side,
    Token,
    TokenByAddress,
    TokenState,
    TokenStateByAddress,
} from 'ts/types';
import { backendClient } from 'ts/utils/backend_client';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';
import { styles as walletItemStyles } from 'ts/utils/wallet_item_styles';

export interface WalletProps {
    userAddress: string;
    networkId: number;
    blockchain: Blockchain;
    blockchainIsLoaded: boolean;
    blockchainErr: BlockchainErrs;
    dispatcher: Dispatcher;
    tokenByAddress: TokenByAddress;
    trackedTokens: Token[];
    userEtherBalanceInWei: BigNumber;
    lastForceTokenStateRefetch: number;
    injectedProviderName: string;
    providerType: ProviderType;
    onToggleLedgerDialog: () => void;
    onAddToken: () => void;
    onRemoveToken: () => void;
}

interface WalletState {
    trackedTokenStateByAddress: TokenStateByAddress;
    wrappedEtherDirection?: Side;
    isHoveringSidebar: boolean;
}

interface AllowanceToggleConfig {
    token: Token;
    tokenState: TokenState;
}

interface AccessoryItemConfig {
    wrappedEtherDirection?: Side;
    allowanceToggleConfig?: AllowanceToggleConfig;
}

const styles: Styles = {
    root: {
        width: 346,
        backgroundColor: colors.white,
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        boxShadow: `0px 4px 6px ${colors.walletBoxShadow}`,
        overflow: 'hidden',
    },
    list: {
        padding: 0,
    },
    tokenItemInnerDiv: {
        paddingLeft: 60,
    },
    headerItemInnerDiv: {
        paddingLeft: 65,
    },
    footerItemInnerDiv: {
        paddingLeft: 24,
        borderTopColor: colors.walletBorder,
        borderTopStyle: 'solid',
        borderWidth: 1,
    },
    borderedItem: {
        borderBottomColor: colors.walletBorder,
        borderBottomStyle: 'solid',
        borderWidth: 1,
    },
    tokenItem: {
        backgroundColor: colors.walletDefaultItemBackground,
    },
    wrappedEtherOpenButtonLabel: {
        fontSize: 10,
    },
    amountLabel: {
        fontWeight: 'bold',
        color: colors.black,
    },
    paddedItem: {
        paddingTop: 8,
        paddingBottom: 8,
    },
    accessoryItemsContainer: {
        width: 150,
        right: 8,
    },
    bodyInnerDiv: {
        padding: 0,
        // TODO: make this completely responsive
        maxHeight: 475,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
    },
};

const ETHER_ICON_PATH = '/images/ether.png';
const ETHER_TOKEN_SYMBOL = 'WETH';
const ZRX_TOKEN_SYMBOL = 'ZRX';
const ETHER_SYMBOL = 'ETH';
const ICON_DIMENSION = 24;
const TOKEN_AMOUNT_DISPLAY_PRECISION = 3;
const BODY_ITEM_KEY = 'BODY';
const HEADER_ITEM_KEY = 'HEADER';
const FOOTER_ITEM_KEY = 'FOOTER';
const DISCONNECTED_ITEM_KEY = 'DISCONNECTED';
const ETHER_ITEM_KEY = 'ETHER';
const USD_DECIMAL_PLACES = 2;

export class Wallet extends React.Component<WalletProps, WalletState> {
    private _isUnmounted: boolean;
    constructor(props: WalletProps) {
        super(props);
        this._isUnmounted = false;
        const trackedTokenAddresses = _.map(props.trackedTokens, token => token.address);
        const initialTrackedTokenStateByAddress = this._getInitialTrackedTokenStateByAddress(trackedTokenAddresses);
        this.state = {
            trackedTokenStateByAddress: initialTrackedTokenStateByAddress,
            wrappedEtherDirection: undefined,
            isHoveringSidebar: false,
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
    public componentWillReceiveProps(nextProps: WalletProps): void {
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
            const initialTrackedTokenStateByAddress = this._getInitialTrackedTokenStateByAddress(newTokenAddresses);
            _.assign(trackedTokenStateByAddress, initialTrackedTokenStateByAddress);
            this.setState({
                trackedTokenStateByAddress,
            });
            // Fetch the actual balance/allowance.
            // tslint:disable-next-line:no-floating-promises
            this._fetchBalancesAndAllowancesAsync(newTokenAddresses);
        }
    }
    public render(): React.ReactNode {
        const isReadyToRender = this.props.blockchainIsLoaded && this.props.blockchainErr === BlockchainErrs.NoError;
        return <div style={styles.root}>{isReadyToRender && this._renderRows()}</div>;
    }
    private _renderRows(): React.ReactNode {
        const isAddressAvailable = !_.isEmpty(this.props.userAddress);
        return (
            <List style={styles.list}>
                {isAddressAvailable
                    ? _.concat(this._renderConnectedHeaderRows(), this._renderBody(), this._renderFooterRows())
                    : _.concat(this._renderDisconnectedHeaderRows(), this._renderDisconnectedRows())}
            </List>
        );
    }
    private _renderDisconnectedHeaderRows(): React.ReactElement<{}> {
        const userAddress = this.props.userAddress;
        const primaryText = 'wallet';
        return (
            <ListItem
                key={HEADER_ITEM_KEY}
                primaryText={primaryText.toUpperCase()}
                leftIcon={<ActionAccountBalanceWallet color={colors.mediumBlue} />}
                style={styles.paddedItem}
                innerDivStyle={styles.headerItemInnerDiv}
            />
        );
    }
    private _renderDisconnectedRows(): React.ReactElement<{}> {
        return (
            <WalletDisconnectedItem
                key={DISCONNECTED_ITEM_KEY}
                providerType={this.props.providerType}
                injectedProviderName={this.props.injectedProviderName}
                onToggleLedgerDialog={this.props.onToggleLedgerDialog}
            />
        );
    }
    private _renderConnectedHeaderRows(): React.ReactElement<{}> {
        const userAddress = this.props.userAddress;
        const primaryText = utils.getAddressBeginAndEnd(userAddress);
        return (
            <ListItem
                key={HEADER_ITEM_KEY}
                primaryText={primaryText}
                leftIcon={<Identicon address={userAddress} diameter={ICON_DIMENSION} />}
                style={{ ...styles.paddedItem, ...styles.borderedItem }}
                innerDivStyle={styles.headerItemInnerDiv}
            />
        );
    }
    private _renderBody(): React.ReactElement<{}> {
        const bodyStyle: React.CSSProperties = {
            ...styles.bodyInnerDiv,
            overflow: this.state.isHoveringSidebar ? 'auto' : 'hidden',
        };
        return (
            <ListItem
                key={BODY_ITEM_KEY}
                innerDivStyle={bodyStyle}
                onMouseEnter={this._onSidebarHover.bind(this)}
                onMouseLeave={this._onSidebarHoverOff.bind(this)}
            >
                {this._renderEthRows()}
                {this._renderTokenRows()}
            </ListItem>
        );
    }
    private _onSidebarHover(event: React.FormEvent<HTMLInputElement>): void {
        this.setState({
            isHoveringSidebar: true,
        });
    }
    private _onSidebarHoverOff(): void {
        this.setState({
            isHoveringSidebar: false,
        });
    }
    private _renderFooterRows(): React.ReactElement<{}> {
        return (
            <ListItem
                key={FOOTER_ITEM_KEY}
                primaryText={
                    <div className="flex">
                        <FloatingActionButton mini={true} zDepth={0} onClick={this.props.onAddToken}>
                            <ContentAdd />
                        </FloatingActionButton>
                        <FloatingActionButton mini={true} zDepth={0} className="px1" onClick={this.props.onRemoveToken}>
                            <ContentRemove />
                        </FloatingActionButton>
                        <div
                            style={{
                                paddingLeft: 10,
                                position: 'relative',
                                top: '50%',
                                transform: 'translateY(33%)',
                            }}
                        >
                            add/remove tokens
                        </div>
                    </div>
                }
                disabled={true}
                innerDivStyle={styles.footerItemInnerDiv}
            />
        );
    }
    private _renderEthRows(): React.ReactNode {
        const primaryText = this._renderAmount(
            this.props.userEtherBalanceInWei,
            constants.DECIMAL_PLACES_ETH,
            ETHER_SYMBOL,
        );
        const etherToken = this._getEthToken();
        const etherPrice = this.state.trackedTokenStateByAddress[etherToken.address].price;
        const secondaryText = this._renderValue(
            this.props.userEtherBalanceInWei,
            constants.DECIMAL_PLACES_ETH,
            etherPrice,
        );
        const accessoryItemConfig = {
            wrappedEtherDirection: Side.Deposit,
        };
        const isInWrappedEtherState =
            !_.isUndefined(this.state.wrappedEtherDirection) &&
            this.state.wrappedEtherDirection === accessoryItemConfig.wrappedEtherDirection;
        const style = isInWrappedEtherState
            ? { ...walletItemStyles.focusedItem, ...styles.paddedItem }
            : { ...styles.tokenItem, ...styles.borderedItem, ...styles.paddedItem };
        return (
            <div key={ETHER_ITEM_KEY}>
                <ListItem
                    primaryText={primaryText}
                    secondaryText={secondaryText}
                    leftIcon={<img style={{ width: ICON_DIMENSION, height: ICON_DIMENSION }} src={ETHER_ICON_PATH} />}
                    rightAvatar={this._renderAccessoryItems(accessoryItemConfig)}
                    disableTouchRipple={true}
                    style={style}
                    innerDivStyle={styles.tokenItemInnerDiv}
                />
                {isInWrappedEtherState && (
                    <WrapEtherItem
                        userAddress={this.props.userAddress}
                        networkId={this.props.networkId}
                        blockchain={this.props.blockchain}
                        dispatcher={this.props.dispatcher}
                        userEtherBalanceInWei={this.props.userEtherBalanceInWei}
                        direction={accessoryItemConfig.wrappedEtherDirection}
                        etherToken={etherToken}
                        lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                        onConversionSuccessful={this._closeWrappedEtherActionRow.bind(this)}
                        refetchEthTokenStateAsync={this._refetchTokenStateAsync.bind(this, etherToken.address)}
                    />
                )}
            </div>
        );
    }
    private _renderTokenRows(): React.ReactNode {
        const trackedTokens = this.props.trackedTokens;
        const trackedTokensStartingWithEtherToken = trackedTokens.sort(
            firstBy((t: Token) => t.symbol !== ETHER_TOKEN_SYMBOL)
                .thenBy((t: Token) => t.symbol !== ZRX_TOKEN_SYMBOL)
                .thenBy('address'),
        );
        return _.map(trackedTokensStartingWithEtherToken, this._renderTokenRow.bind(this));
    }
    private _renderTokenRow(token: Token, index: number): React.ReactNode {
        const tokenState = this.state.trackedTokenStateByAddress[token.address];
        const tokenLink = sharedUtils.getEtherScanLinkIfExists(
            token.address,
            this.props.networkId,
            EtherscanLinkSuffixes.Address,
        );
        const primaryText = this._renderAmount(tokenState.balance, token.decimals, token.symbol);
        const secondaryText = this._renderValue(tokenState.balance, token.decimals, tokenState.price);
        const wrappedEtherDirection = token.symbol === ETHER_TOKEN_SYMBOL ? Side.Receive : undefined;
        const accessoryItemConfig: AccessoryItemConfig = {
            wrappedEtherDirection,
            allowanceToggleConfig: {
                token,
                tokenState,
            },
        };
        // if this is the last item in the list, do not render the border, it is rendered by the footer
        const borderedStyle = index !== this.props.trackedTokens.length - 1 ? styles.borderedItem : {};
        const shouldShowWrapEtherItem =
            !_.isUndefined(this.state.wrappedEtherDirection) &&
            this.state.wrappedEtherDirection === accessoryItemConfig.wrappedEtherDirection;
        const style = shouldShowWrapEtherItem
            ? { ...walletItemStyles.focusedItem, ...styles.paddedItem }
            : { ...styles.tokenItem, ...borderedStyle, ...styles.paddedItem };
        const etherToken = this._getEthToken();
        return (
            <div key={token.address}>
                <ListItem
                    primaryText={primaryText}
                    secondaryText={secondaryText}
                    leftIcon={this._renderTokenIcon(token, tokenLink)}
                    rightAvatar={this._renderAccessoryItems(accessoryItemConfig)}
                    disableTouchRipple={true}
                    style={style}
                    innerDivStyle={styles.tokenItemInnerDiv}
                />
                {shouldShowWrapEtherItem && (
                    <WrapEtherItem
                        userAddress={this.props.userAddress}
                        networkId={this.props.networkId}
                        blockchain={this.props.blockchain}
                        dispatcher={this.props.dispatcher}
                        userEtherBalanceInWei={this.props.userEtherBalanceInWei}
                        direction={accessoryItemConfig.wrappedEtherDirection}
                        etherToken={etherToken}
                        lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                        onConversionSuccessful={this._closeWrappedEtherActionRow.bind(this)}
                        refetchEthTokenStateAsync={this._refetchTokenStateAsync.bind(this, etherToken.address)}
                    />
                )}
            </div>
        );
    }
    private _renderAccessoryItems(config: AccessoryItemConfig): React.ReactElement<{}> {
        const shouldShowWrappedEtherAction = !_.isUndefined(config.wrappedEtherDirection);
        const shouldShowToggle = !_.isUndefined(config.allowanceToggleConfig);
        return (
            <div style={styles.accessoryItemsContainer}>
                <div className="flex">
                    <div className="flex-auto">
                        {shouldShowWrappedEtherAction && this._renderWrappedEtherButton(config.wrappedEtherDirection)}
                    </div>
                    <div className="flex-last py1">
                        {shouldShowToggle && this._renderAllowanceToggle(config.allowanceToggleConfig)}
                    </div>
                </div>
            </div>
        );
    }
    private _renderAllowanceToggle(config: AllowanceToggleConfig): React.ReactNode {
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
    private _renderAmount(amount: BigNumber, decimals: number, symbol: string): React.ReactNode {
        const unitAmount = ZeroEx.toUnitAmount(amount, decimals);
        const formattedAmount = unitAmount.toPrecision(TOKEN_AMOUNT_DISPLAY_PRECISION);
        const result = `${formattedAmount} ${symbol}`;
        return <div style={styles.amountLabel}>{result}</div>;
    }
    private _renderValue(amount: BigNumber, decimals: number, price?: BigNumber): React.ReactNode {
        if (_.isUndefined(price)) {
            return null;
        }
        const unitAmount = ZeroEx.toUnitAmount(amount, decimals);
        const value = unitAmount.mul(price);
        const formattedAmount = value.toFixed(USD_DECIMAL_PLACES);
        const result = `$${formattedAmount}`;
        return result;
    }
    private _renderTokenIcon(token: Token, tokenLink?: string): React.ReactElement<{}> {
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
    private _renderWrappedEtherButton(wrappedEtherDirection: Side): React.ReactNode {
        const isWrappedEtherDirectionOpen = this.state.wrappedEtherDirection === wrappedEtherDirection;
        let buttonLabel;
        let buttonIcon;
        if (isWrappedEtherDirectionOpen) {
            buttonLabel = 'cancel';
            buttonIcon = <Close />;
        } else {
            switch (wrappedEtherDirection) {
                case Side.Deposit:
                    buttonLabel = 'wrap';
                    buttonIcon = <NavigationArrowDownward />;
                    break;
                case Side.Receive:
                    buttonLabel = 'unwrap';
                    buttonIcon = <NavigationArrowUpward />;
                    break;
                default:
                    throw utils.spawnSwitchErr('wrappedEtherDirection', wrappedEtherDirection);
            }
        }
        const onClick = isWrappedEtherDirectionOpen
            ? this._closeWrappedEtherActionRow.bind(this)
            : this._openWrappedEtherActionRow.bind(this, wrappedEtherDirection);
        return (
            <FlatButton
                label={buttonLabel}
                labelPosition="after"
                primary={true}
                icon={buttonIcon}
                labelStyle={styles.wrappedEtherOpenButtonLabel}
                onClick={onClick}
            />
        );
    }
    private _getInitialTrackedTokenStateByAddress(tokenAddresses: string[]): TokenStateByAddress {
        const trackedTokenStateByAddress: TokenStateByAddress = {};
        _.each(tokenAddresses, tokenAddress => {
            trackedTokenStateByAddress[tokenAddress] = {
                balance: new BigNumber(0),
                allowance: new BigNumber(0),
                isLoaded: false,
            };
        });
        return trackedTokenStateByAddress;
    }
    private async _fetchBalancesAndAllowancesAsync(tokenAddresses: string[]): Promise<void> {
        const balanceAndAllowanceTupleByAddress: ItemByAddress<BigNumber[]> = {};
        const userAddressIfExists = _.isEmpty(this.props.userAddress) ? undefined : this.props.userAddress;
        for (const tokenAddress of tokenAddresses) {
            const balanceAndAllowanceTuple = await this.props.blockchain.getTokenBalanceAndAllowanceAsync(
                userAddressIfExists,
                tokenAddress,
            );
            balanceAndAllowanceTupleByAddress[tokenAddress] = balanceAndAllowanceTuple;
        }
        const priceByAddress = await this._getPriceByAddressAsync(tokenAddresses);
        const trackedTokenStateByAddress = _.reduce(
            tokenAddresses,
            (acc, address) => {
                const [balance, allowance] = balanceAndAllowanceTupleByAddress[address];
                const priceIfExists = _.get(priceByAddress, address);
                acc[address] = {
                    balance,
                    allowance,
                    price: priceIfExists,
                    isLoaded: true,
                };
                return acc;
            },
            this.state.trackedTokenStateByAddress,
        );

        if (!this._isUnmounted) {
            this.setState({
                trackedTokenStateByAddress,
            });
        }
    }
    private async _refetchTokenStateAsync(tokenAddress: string): Promise<void> {
        await this._fetchBalancesAndAllowancesAsync([tokenAddress]);
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
            if (!_.isUndefined(tokenIfExists)) {
                const symbol = tokenIfExists.symbol;
                tokenAddressBySymbol[symbol] = address;
            }
        });
        const tokenSymbols = _.keys(tokenAddressBySymbol);
        try {
            const priceBySymbol = await backendClient.getPriceInfoAsync(tokenSymbols);
            const priceByAddress = _.mapKeys(priceBySymbol, (value, symbol) => _.get(tokenAddressBySymbol, symbol));
            const result = _.mapValues(priceByAddress, price => {
                const priceBigNumber = new BigNumber(price);
                return priceBigNumber;
            });
            return result;
        } catch (err) {
            return {};
        }
    }
    private _openWrappedEtherActionRow(wrappedEtherDirection: Side): void {
        this.setState({
            wrappedEtherDirection,
        });
    }
    private _closeWrappedEtherActionRow(): void {
        this.setState({
            wrappedEtherDirection: undefined,
        });
    }
    private _getEthToken(): Token {
        const tokens = _.values(this.props.tokenByAddress);
        const etherToken = _.find(tokens, { symbol: ETHER_TOKEN_SYMBOL });
        return etherToken;
    }
} // tslint:disable:max-file-line-count
