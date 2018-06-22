import {
    constants as sharedConstants,
    EtherscanLinkSuffixes,
    Styles,
    utils as sharedUtils,
} from '@0xproject/react-shared';
import { BigNumber, errorUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import FloatingActionButton from 'material-ui/FloatingActionButton';

import { ListItem } from 'material-ui/List';
import ActionAccountBalanceWallet from 'material-ui/svg-icons/action/account-balance-wallet';
import ContentAdd from 'material-ui/svg-icons/content/add';
import ContentRemove from 'material-ui/svg-icons/content/remove';
import * as React from 'react';
import { Link } from 'react-router-dom';
import firstBy = require('thenby');

import { Blockchain } from 'ts/blockchain';
import { Container } from 'ts/components/ui/container';
import { IconButton } from 'ts/components/ui/icon_button';
import { Identicon } from 'ts/components/ui/identicon';
import { Island } from 'ts/components/ui/island';
import { TokenIcon } from 'ts/components/ui/token_icon';
import { WalletDisconnectedItem } from 'ts/components/wallet/wallet_disconnected_item';
import { WrapEtherItem } from 'ts/components/wallet/wrap_ether_item';
import { AllowanceToggle } from 'ts/containers/inputs/allowance_toggle';
import { Dispatcher } from 'ts/redux/dispatcher';
import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';
import {
    BlockchainErrs,
    ProviderType,
    ScreenWidths,
    Side,
    Token,
    TokenByAddress,
    TokenState,
    TokenStateByAddress,
    WebsitePaths,
} from 'ts/types';
import { analytics } from 'ts/utils/analytics';
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
    userEtherBalanceInWei?: BigNumber;
    lastForceTokenStateRefetch: number;
    injectedProviderName: string;
    providerType: ProviderType;
    screenWidth: ScreenWidths;
    location: Location;
    trackedTokenStateByAddress: TokenStateByAddress;
    onToggleLedgerDialog: () => void;
    onAddToken: () => void;
    onRemoveToken: () => void;
    refetchTokenStateAsync: (tokenAddress: string) => Promise<void>;
    style: React.CSSProperties;
}

interface WalletState {
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
        width: '100%',
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
        minHeight: 85,
    },
    amountLabel: {
        fontWeight: 'bold',
        color: colors.black,
    },
    valueLabel: {
        color: colors.grey,
        fontSize: 14,
    },
    paddedItem: {
        paddingTop: 8,
        paddingBottom: 8,
    },
    bodyInnerDiv: {
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
    },
    manageYourWalletText: {
        color: colors.mediumBlue,
        fontWeight: 'bold',
    },
    loadingBody: {
        height: 381,
    },
};

const ETHER_ICON_PATH = '/images/ether.png';
const ICON_DIMENSION = 28;
const BODY_ITEM_KEY = 'BODY';
const HEADER_ITEM_KEY = 'HEADER';
const FOOTER_ITEM_KEY = 'FOOTER';
const DISCONNECTED_ITEM_KEY = 'DISCONNECTED';
const ETHER_ITEM_KEY = 'ETHER';
const USD_DECIMAL_PLACES = 2;
const NO_ALLOWANCE_TOGGLE_SPACE_WIDTH = 56;
const ACCOUNT_PATH = `${WebsitePaths.Portal}/account`;

const ActionButton = styled(FloatingActionButton)`
    button {
        position: static !important;
    }
`;

export class Wallet extends React.Component<WalletProps, WalletState> {
    public static defaultProps = {
        style: {},
    };
    constructor(props: WalletProps) {
        super(props);
        this.state = {
            wrappedEtherDirection: undefined,
            isHoveringSidebar: false,
        };
    }
    public render(): React.ReactNode {
        const isBlockchainLoaded = this.props.blockchainIsLoaded && this.props.blockchainErr === BlockchainErrs.NoError;
        return (
            <Island className="flex flex-column wallet" style={{ ...styles.root, ...this.props.style }}>
                {isBlockchainLoaded ? this._renderLoadedRows() : this._renderLoadingRows()}
            </Island>
        );
    }
    private _renderLoadedRows(): React.ReactNode {
        const isAddressAvailable = !_.isEmpty(this.props.userAddress);
        return isAddressAvailable
            ? _.concat(this._renderConnectedHeaderRows(), this._renderBody(), this._renderFooterRows())
            : _.concat(this._renderDisconnectedHeaderRows(), this._renderDisconnectedRows());
    }
    private _renderLoadingRows(): React.ReactNode {
        return _.concat(this._renderDisconnectedHeaderRows(), this._renderLoadingBodyRows());
    }
    private _renderLoadingBodyRows(): React.ReactElement<{}> {
        return (
            <div key={BODY_ITEM_KEY} className="flex items-center" style={styles.loadingBody}>
                <div className="mx-auto">
                    <CircularProgress size={40} thickness={5} />
                </div>
            </div>
        );
    }
    private _renderDisconnectedHeaderRows(): React.ReactElement<{}> {
        const primaryText = 'wallet';
        return (
            <StandardIconRow
                key={HEADER_ITEM_KEY}
                icon={<ActionAccountBalanceWallet color={colors.mediumBlue} />}
                main={primaryText.toUpperCase()}
                style={styles.borderedItem}
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
            <Link key={HEADER_ITEM_KEY} to={ACCOUNT_PATH} style={{ textDecoration: 'none' }}>
                <StandardIconRow
                    icon={<Identicon address={userAddress} diameter={ICON_DIMENSION} />}
                    main={primaryText}
                    style={styles.borderedItem}
                />
            </Link>
        );
    }
    private _renderBody(): React.ReactElement<{}> {
        const bodyStyle: React.CSSProperties = {
            ...styles.bodyInnerDiv,
            overflow: this.state.isHoveringSidebar ? 'auto' : 'hidden',
            // TODO: make this completely responsive
            maxHeight: this.props.screenWidth !== ScreenWidths.Sm ? 475 : undefined,
        };
        return (
            <div
                style={bodyStyle}
                key={BODY_ITEM_KEY}
                onMouseEnter={this._onSidebarHover.bind(this)}
                onMouseLeave={this._onSidebarHoverOff.bind(this)}
            >
                {this._renderEthRows()}
                {this._renderTokenRows()}
            </div>
        );
    }
    private _onSidebarHover(_event: React.FormEvent<HTMLInputElement>): void {
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
            <div key={FOOTER_ITEM_KEY}>
                <ListItem
                    primaryText={
                        <div className="flex">
                            <ActionButton mini={true} zDepth={0} onClick={this.props.onAddToken}>
                                <ContentAdd />
                            </ActionButton>
                            <ActionButton mini={true} zDepth={0} className="px1" onClick={this.props.onRemoveToken}>
                                <ContentRemove />
                            </ActionButton>
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
                    style={styles.borderedItem}
                />
                {this.props.location.pathname !== ACCOUNT_PATH && (
                    <Link to={ACCOUNT_PATH} style={{ textDecoration: 'none' }}>
                        <ListItem
                            primaryText={
                                <div className="flex right" style={styles.manageYourWalletText}>
                                    manage your wallet
                                </div>
                                // https://github.com/palantir/tslint-react/issues/140
                                // tslint:disable-next-line:jsx-curly-spacing
                            }
                            style={{ ...styles.paddedItem, ...styles.borderedItem }}
                        />
                    </Link>
                )}
            </div>
        );
    }
    private _renderEthRows(): React.ReactNode {
        const icon = <img style={{ width: ICON_DIMENSION, height: ICON_DIMENSION }} src={ETHER_ICON_PATH} />;
        const primaryText = this._renderAmount(
            this.props.userEtherBalanceInWei || new BigNumber(0),
            constants.DECIMAL_PLACES_ETH,
            constants.ETHER_SYMBOL,
            _.isUndefined(this.props.userEtherBalanceInWei),
        );
        const etherToken = this._getEthToken();
        const etherTokenState = this.props.trackedTokenStateByAddress[etherToken.address];
        const etherPrice = etherTokenState.price;
        const secondaryText = this._renderValue(
            this.props.userEtherBalanceInWei || new BigNumber(0),
            constants.DECIMAL_PLACES_ETH,
            etherPrice,
            _.isUndefined(this.props.userEtherBalanceInWei) || !etherTokenState.isLoaded,
        );
        const accessoryItemConfig = {
            wrappedEtherDirection: Side.Deposit,
        };
        const key = ETHER_ITEM_KEY;
        return this._renderBalanceRow(key, icon, primaryText, secondaryText, accessoryItemConfig, false, 'eth-row');
    }
    private _renderTokenRows(): React.ReactNode {
        const trackedTokens = this.props.trackedTokens;
        const trackedTokensStartingWithEtherToken = trackedTokens.sort(
            firstBy((t: Token) => t.symbol !== constants.ETHER_TOKEN_SYMBOL)
                .thenBy((t: Token) => t.symbol !== constants.ZRX_TOKEN_SYMBOL)
                .thenBy('address'),
        );
        return _.map(trackedTokensStartingWithEtherToken, this._renderTokenRow.bind(this));
    }
    private _renderTokenRow(token: Token, index: number): React.ReactNode {
        const tokenState = this.props.trackedTokenStateByAddress[token.address];
        if (_.isUndefined(tokenState)) {
            return null;
        }
        const tokenLink = sharedUtils.getEtherScanLinkIfExists(
            token.address,
            this.props.networkId,
            EtherscanLinkSuffixes.Address,
        );
        const icon = <TokenIcon token={token} diameter={ICON_DIMENSION} link={tokenLink} />;
        const isWeth = token.symbol === constants.ETHER_TOKEN_SYMBOL;
        const wrappedEtherDirection = isWeth ? Side.Receive : undefined;
        const primaryText = this._renderAmount(tokenState.balance, token.decimals, token.symbol, !tokenState.isLoaded);
        const secondaryText = this._renderValue(
            tokenState.balance,
            token.decimals,
            tokenState.price,
            !tokenState.isLoaded,
        );
        const accessoryItemConfig: AccessoryItemConfig = {
            wrappedEtherDirection,
            allowanceToggleConfig: {
                token,
                tokenState,
            },
        };
        const key = token.address;
        const isLastRow = index === this.props.trackedTokens.length - 1;
        return this._renderBalanceRow(
            key,
            icon,
            primaryText,
            secondaryText,
            accessoryItemConfig,
            isLastRow,
            isWeth ? 'weth-row' : undefined,
        );
    }
    private _renderBalanceRow(
        key: string,
        icon: React.ReactNode,
        primaryText: React.ReactNode,
        secondaryText: React.ReactNode,
        accessoryItemConfig: AccessoryItemConfig,
        isLastRow: boolean,
        className?: string,
    ): React.ReactNode {
        const shouldShowWrapEtherItem =
            !_.isUndefined(this.state.wrappedEtherDirection) &&
            this.state.wrappedEtherDirection === accessoryItemConfig.wrappedEtherDirection &&
            !_.isUndefined(this.props.userEtherBalanceInWei);
        let additionalStyle;
        if (shouldShowWrapEtherItem) {
            additionalStyle = walletItemStyles.focusedItem;
        } else if (!isLastRow) {
            additionalStyle = styles.borderedItem;
        }
        const style = { ...styles.tokenItem, ...additionalStyle };
        const etherToken = this._getEthToken();
        return (
            <div key={key} className={`flex flex-column ${className || ''}`}>
                <StandardIconRow
                    icon={icon}
                    main={
                        <div className="flex flex-column">
                            {primaryText}
                            <Container marginTop="3px">{secondaryText}</Container>
                        </div>
                    }
                    accessory={this._renderAccessoryItems(accessoryItemConfig)}
                    style={style}
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
                        // tslint:disable:jsx-no-lambda
                        refetchEthTokenStateAsync={async () => this.props.refetchTokenStateAsync(etherToken.address)}
                    />
                )}
            </div>
        );
    }
    private _renderAccessoryItems(config: AccessoryItemConfig): React.ReactElement<{}> {
        const shouldShowWrappedEtherAction = !_.isUndefined(config.wrappedEtherDirection);
        const shouldShowToggle = !_.isUndefined(config.allowanceToggleConfig);
        // if we don't have a toggle, we still want some space to the right of the "wrap" button so that it aligns with
        // the "unwrap" button in the row below
        const toggle = shouldShowToggle ? (
            this._renderAllowanceToggle(config.allowanceToggleConfig)
        ) : (
            <div style={{ width: NO_ALLOWANCE_TOGGLE_SPACE_WIDTH }} />
        );
        return (
            <div className="flex items-center">
                <div className="flex-auto">
                    {shouldShowWrappedEtherAction && this._renderWrappedEtherButton(config.wrappedEtherDirection)}
                </div>
                <div className="flex-last pl2">{toggle}</div>
            </div>
        );
    }
    private _renderAllowanceToggle(config: AllowanceToggleConfig): React.ReactNode {
        // TODO: Error handling
        return (
            <AllowanceToggle
                blockchain={this.props.blockchain}
                token={config.token}
                tokenState={config.tokenState}
                isDisabled={!config.tokenState.isLoaded}
                refetchTokenStateAsync={async () => this.props.refetchTokenStateAsync(config.token.address)}
            />
        );
    }
    private _renderAmount(
        amount: BigNumber,
        decimals: number,
        symbol: string,
        isLoading: boolean = false,
    ): React.ReactNode {
        if (isLoading) {
            return (
                <PlaceHolder hideChildren={isLoading}>
                    <div style={styles.amountLabel}>0.00 XXX</div>
                </PlaceHolder>
            );
        } else {
            const result = utils.getFormattedAmount(amount, decimals, symbol);
            return <div style={styles.amountLabel}>{result}</div>;
        }
    }
    private _renderValue(
        amount: BigNumber,
        decimals: number,
        price?: BigNumber,
        isLoading: boolean = false,
    ): React.ReactNode {
        let result;
        if (!isLoading) {
            if (_.isUndefined(price)) {
                result = '--';
            } else {
                const unitAmount = Web3Wrapper.toUnitAmount(amount, decimals);
                const value = unitAmount.mul(price);
                const formattedAmount = value.toFixed(USD_DECIMAL_PLACES);
                result = `$${formattedAmount}`;
            }
        } else {
            result = '$0.00';
        }
        return (
            <PlaceHolder hideChildren={isLoading}>
                <div style={styles.valueLabel}>{result}</div>
            </PlaceHolder>
        );
    }
    private _renderWrappedEtherButton(wrappedEtherDirection: Side): React.ReactNode {
        const isWrappedEtherDirectionOpen = this.state.wrappedEtherDirection === wrappedEtherDirection;
        let buttonLabel;
        let buttonIconName;
        if (isWrappedEtherDirectionOpen) {
            buttonLabel = 'cancel';
            buttonIconName = 'zmdi-close';
        } else {
            switch (wrappedEtherDirection) {
                case Side.Deposit:
                    buttonLabel = 'wrap';
                    buttonIconName = 'zmdi-long-arrow-down';
                    break;
                case Side.Receive:
                    buttonLabel = 'unwrap';
                    buttonIconName = 'zmdi-long-arrow-up';
                    break;
                default:
                    throw errorUtils.spawnSwitchErr('wrappedEtherDirection', wrappedEtherDirection);
            }
        }
        const onClick = isWrappedEtherDirectionOpen
            ? this._closeWrappedEtherActionRow.bind(this, wrappedEtherDirection)
            : this._openWrappedEtherActionRow.bind(this, wrappedEtherDirection);
        return (
            <IconButton iconName={buttonIconName} labelText={buttonLabel} onClick={onClick} color={colors.mediumBlue} />
        );
    }
    private _openWrappedEtherActionRow(wrappedEtherDirection: Side): void {
        const networkName = sharedConstants.NETWORK_NAME_BY_ID[this.props.networkId];
        const action =
            wrappedEtherDirection === Side.Deposit ? 'Wallet - Wrap ETH Opened' : 'Wallet - Unwrap WETH Opened';
        analytics.logEvent('Portal', action, networkName);
        this.setState({
            wrappedEtherDirection,
        });
    }
    private _closeWrappedEtherActionRow(wrappedEtherDirection: Side): void {
        const networkName = sharedConstants.NETWORK_NAME_BY_ID[this.props.networkId];
        const action =
            wrappedEtherDirection === Side.Deposit ? 'Wallet - Wrap ETH Closed' : 'Wallet - Unwrap WETH Closed';
        analytics.logEvent('Portal', action, networkName);
        this.setState({
            wrappedEtherDirection: undefined,
        });
    }
    private _getEthToken(): Token {
        return utils.getEthToken(this.props.tokenByAddress);
    }
}

interface StandardIconRowProps {
    icon: React.ReactNode;
    main: React.ReactNode;
    accessory?: React.ReactNode;
    style?: React.CSSProperties;
}
const StandardIconRow = (props: StandardIconRowProps) => {
    return (
        <div className="flex items-center" style={props.style}>
            <div className="p2">{props.icon}</div>
            <div className="flex-none pr2 pt2 pb2">{props.main}</div>
            <div className="flex-auto" />
            <div>{props.accessory}</div>
        </div>
    );
};
interface PlaceHolderProps {
    hideChildren: React.ReactNode;
    children?: React.ReactNode;
}
const PlaceHolder = (props: PlaceHolderProps) => {
    const rootBackgroundColor = props.hideChildren ? colors.lightGrey : 'transparent';
    const rootStyle: React.CSSProperties = {
        backgroundColor: rootBackgroundColor,
        display: 'inline-block',
        borderRadius: 2,
    };
    const childrenVisibility = props.hideChildren ? 'hidden' : 'visible';
    const childrenStyle: React.CSSProperties = { visibility: childrenVisibility };
    return (
        <div style={rootStyle}>
            <div style={childrenStyle}>{props.children}</div>
        </div>
    );
};
// tslint:disable:max-file-line-count
