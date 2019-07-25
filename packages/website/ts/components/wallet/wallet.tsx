import { BigNumber, errorUtils } from '@0x/utils';
import * as _ from 'lodash';
import { utils } from 'ts/utils/utils';

import ActionAccountBalanceWallet from 'material-ui/svg-icons/action/account-balance-wallet';
import * as React from 'react';
import firstBy from 'thenby';

import { Blockchain } from 'ts/blockchain';
import { AccountConnection } from 'ts/components/ui/account_connection';
import { Balance } from 'ts/components/ui/balance';
import { Container } from 'ts/components/ui/container';
import { DropDown, DropdownMouseEvent } from 'ts/components/ui/drop_down';
import { IconButton } from 'ts/components/ui/icon_button';
import { Identicon } from 'ts/components/ui/identicon';
import { Island } from 'ts/components/ui/island';
import { PointerDirection } from 'ts/components/ui/pointer';
import {
    CopyAddressSimpleMenuItem,
    DifferentWalletSimpleMenuItem,
    GoToAccountManagementSimpleMenuItem,
    SimpleMenu,
    SimpleMenuItem,
} from 'ts/components/ui/simple_menu';
import { Text } from 'ts/components/ui/text';
import { TokenIcon } from 'ts/components/ui/token_icon';
import { BodyOverlay } from 'ts/components/wallet/body_overlay';
import { NullTokenRow } from 'ts/components/wallet/null_token_row';
import { PlaceHolder } from 'ts/components/wallet/placeholder';
import { StandardIconRow } from 'ts/components/wallet/standard_icon_row';
import { WrapEtherItem } from 'ts/components/wallet/wrap_ether_item';
import { AllowanceStateToggle } from 'ts/containers/inputs/allowance_state_toggle';
import { Dispatcher } from 'ts/redux/dispatcher';
import { colors } from 'ts/style/colors';
import {
    AccountState,
    BlockchainErrs,
    EtherscanLinkSuffixes,
    ProviderType,
    ScreenWidths,
    Side,
    Token,
    TokenByAddress,
    TokenState,
    TokenStateByAddress,
} from 'ts/types';
import { analytics } from 'ts/utils/analytics';
import { constants } from 'ts/utils/constants';

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
    toggleTooltipDirection?: PointerDirection;
}

interface WalletState {
    wrappedEtherDirection?: Side;
    isHoveringSidebar: boolean;
}

interface AllowanceStateToggleConfig {
    token: Token;
    tokenState: TokenState;
}

interface AccessoryItemConfig {
    wrappedEtherDirection?: Side;
    allowanceStateToggleConfig?: AllowanceStateToggleConfig;
}

const ETHER_ICON_PATH = '/images/ether.png';
const ICON_DIMENSION = 28;
const BODY_ITEM_KEY = 'BODY';
const HEADER_ITEM_KEY = 'HEADER';
const ETHER_ITEM_KEY = 'ETHER';
const WRAP_ROW_ALLOWANCE_TOGGLE_WIDTH = 67;
const ALLOWANCE_TOGGLE_WIDTH = 56;
const PLACEHOLDER_COLOR = colors.grey300;
const LOADING_ROWS_COUNT = 6;

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
    public componentDidUpdate(prevProps: WalletProps): void {
        const currentTrackedTokens = this.props.trackedTokens;
        const differentTrackedTokens = _.difference(currentTrackedTokens, prevProps.trackedTokens);
        const firstDifferentTrackedToken = _.head(differentTrackedTokens);
        // check if there is only one different token, and if that token is a member of the current tracked tokens
        // this means that the token was added, not removed
        if (
            firstDifferentTrackedToken !== undefined &&
            _.size(differentTrackedTokens) === 1 &&
            _.includes(currentTrackedTokens, firstDifferentTrackedToken)
        ) {
            document.getElementById(firstDifferentTrackedToken.address).scrollIntoView();
        }
    }
    public render(): React.ReactNode {
        return (
            <Island className="flex flex-column wallet" style={this.props.style}>
                {this._isBlockchainReady() ? this._renderLoadedRows() : this._renderLoadingRows()}
            </Island>
        );
    }
    private _renderLoadingRows(): React.ReactNode {
        return _.concat(this._renderLoadingHeaderRows(), this._renderLoadingBodyRows());
    }
    private _renderLoadingHeaderRows(): React.ReactElement<{}> {
        return this._renderPlainHeaderRow('Loading...');
    }
    private _renderLoadingBodyRows(): React.ReactElement<{}> {
        const bodyStyle = this._getBodyStyle();
        const loadingRowsRange = _.range(LOADING_ROWS_COUNT);
        return (
            <div key={BODY_ITEM_KEY} className="flex flex-column" style={bodyStyle}>
                {_.map(loadingRowsRange, index => {
                    return <NullTokenRow key={index} iconDimension={ICON_DIMENSION} fillColor={PLACEHOLDER_COLOR} />;
                })}
                <Container
                    className="flex items-center"
                    position="absolute"
                    width="100%"
                    height="100%"
                    maxHeight={bodyStyle.maxHeight}
                >
                    <div className="mx-auto">
                        <BodyOverlay
                            dispatcher={this.props.dispatcher}
                            userAddress={this.props.userAddress}
                            injectedProviderName={this.props.injectedProviderName}
                            providerType={this.props.providerType}
                            onToggleLedgerDialog={this.props.onToggleLedgerDialog}
                            blockchain={this.props.blockchain}
                            blockchainIsLoaded={this.props.blockchainIsLoaded}
                        />
                    </div>
                </Container>
            </div>
        );
    }
    private _renderLoadedRows(): React.ReactNode {
        const isAddressAvailable = !_.isEmpty(this.props.userAddress);
        return isAddressAvailable
            ? _.concat(this._renderConnectedHeaderRows(), this._renderBody())
            : _.concat(this._renderDisconnectedHeaderRows(), this._renderLoadingBodyRows());
    }
    private _renderDisconnectedHeaderRows(): React.ReactElement<{}> {
        const isExternallyInjectedProvider = utils.isExternallyInjected(
            this.props.providerType,
            this.props.injectedProviderName,
        );
        const text = isExternallyInjectedProvider ? 'Please unlock MetaMask...' : 'Please connect a wallet...';
        return this._renderPlainHeaderRow(text);
    }
    private _renderPlainHeaderRow(text: string): React.ReactElement<{}> {
        return (
            <StandardIconRow
                key={HEADER_ITEM_KEY}
                icon={<ActionAccountBalanceWallet color={colors.grey} />}
                main={
                    <Text fontSize="16px" fontColor={colors.grey}>
                        {text}
                    </Text>
                    // https://github.com/palantir/tslint-react/issues/140
                    // tslint:disable-next-line:jsx-curly-spacing
                }
                minHeight="60px"
                backgroundColor={colors.white}
            />
        );
    }
    private _renderConnectedHeaderRows(): React.ReactElement<{}> {
        const isMobile = this.props.screenWidth === ScreenWidths.Sm;
        const userAddress = this.props.userAddress;
        const accountState = this._getAccountState();
        const main = (
            <div className="flex flex-column">
                <Text fontSize="16px" lineHeight="19px" fontWeight={500}>
                    {utils.getAddressBeginAndEnd(userAddress)}
                </Text>
                <AccountConnection accountState={accountState} injectedProviderName={this.props.injectedProviderName} />
            </div>
        );
        const onClick = _.noop.bind(_);
        const accessory = (
            <DropDown
                activeNode={
                    // this container gives the menu button more of a hover target for the drop down
                    // it prevents accidentally closing the menu by moving off of the button
                    <Container paddingLeft="100px" paddingRight="15px">
                        <Text
                            className="zmdi zmdi-more-horiz"
                            Tag="i"
                            fontSize="32px"
                            fontFamily="Material-Design-Iconic-Font"
                            fontColor={colors.darkGrey}
                            onClick={onClick}
                            hoverColor={colors.mediumBlue}
                        />
                    </Container>
                }
                popoverContent={
                    <SimpleMenu minWidth="150px">
                        <CopyAddressSimpleMenuItem userAddress={this.props.userAddress} />
                        {!isMobile && <DifferentWalletSimpleMenuItem onClick={this.props.onToggleLedgerDialog} />}
                        <SimpleMenuItem displayText="Add Tokens..." onClick={this.props.onAddToken} />
                        <SimpleMenuItem displayText="Remove Tokens..." onClick={this.props.onRemoveToken} />
                        {!isMobile && <GoToAccountManagementSimpleMenuItem />}
                    </SimpleMenu>
                }
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                zDepth={1}
                activateEvent={DropdownMouseEvent.Click}
                closeEvent={DropdownMouseEvent.Click}
            />
        );
        return (
            <StandardIconRow
                key={HEADER_ITEM_KEY}
                icon={<Identicon address={userAddress} diameter={ICON_DIMENSION} />}
                main={main}
                accessory={accessory}
                minHeight="60px"
                backgroundColor={colors.white}
            />
        );
    }
    private _renderBody(): React.ReactElement<{}> {
        const bodyStyle = this._getBodyStyle();
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
    private _getBodyStyle(): React.CSSProperties {
        return {
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
            overflowY: this.state.isHoveringSidebar ? 'scroll' : 'hidden',
            marginRight: this.state.isHoveringSidebar ? 0 : 4,
            minHeight: '250px',
            maxHeight: !utils.isMobileWidth(this.props.screenWidth) ? 'calc(90vh - 300px)' : undefined,
        };
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
    private _renderEthRows(): React.ReactNode {
        const icon = <img style={{ width: ICON_DIMENSION, height: ICON_DIMENSION }} src={ETHER_ICON_PATH} />;
        const primaryText = this._renderAmount(
            this.props.userEtherBalanceInWei || new BigNumber(0),
            constants.DECIMAL_PLACES_ETH,
            constants.ETHER_SYMBOL,
            this.props.userEtherBalanceInWei === undefined,
        );
        const etherToken = this._getEthToken();
        const etherTokenState = this.props.trackedTokenStateByAddress[etherToken.address];
        const etherPrice = etherTokenState.price;
        const secondaryText = this._renderValue(
            this.props.userEtherBalanceInWei || new BigNumber(0),
            constants.DECIMAL_PLACES_ETH,
            etherPrice,
            this.props.userEtherBalanceInWei === undefined || !etherTokenState.isLoaded,
        );
        const accessoryItemConfig = {
            wrappedEtherDirection: Side.Deposit,
        };
        const key = ETHER_ITEM_KEY;
        return this._renderBalanceRow(key, icon, primaryText, secondaryText, accessoryItemConfig);
    }
    private _renderTokenRows(): React.ReactNode {
        const trackedTokens = this.props.trackedTokens;
        const trackedTokensStartingWithEtherToken = trackedTokens.sort(
            firstBy((t: Token) => t.symbol !== constants.ETHER_TOKEN_SYMBOL)
                .thenBy((t: Token) => t.symbol !== constants.ZRX_TOKEN_SYMBOL)
                .thenBy('trackedTimestamp'),
        );
        return _.map(trackedTokensStartingWithEtherToken, this._renderTokenRow.bind(this));
    }
    private _renderTokenRow(token: Token): React.ReactNode {
        const tokenState = this.props.trackedTokenStateByAddress[token.address];
        if (tokenState === undefined) {
            return null;
        }
        const tokenLink = utils.getEtherScanLinkIfExists(
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
            allowanceStateToggleConfig: {
                token,
                tokenState,
            },
        };
        const key = token.address;
        return this._renderBalanceRow(key, icon, primaryText, secondaryText, accessoryItemConfig);
    }
    private _renderBalanceRow(
        key: string,
        icon: React.ReactNode,
        primaryText: React.ReactNode,
        secondaryText: React.ReactNode,
        accessoryItemConfig: AccessoryItemConfig,
        className?: string,
    ): React.ReactNode {
        const shouldShowWrapEtherItem =
            this.state.wrappedEtherDirection !== undefined &&
            this.state.wrappedEtherDirection === accessoryItemConfig.wrappedEtherDirection &&
            this.props.userEtherBalanceInWei !== undefined;
        const etherToken = this._getEthToken();
        const wrapEtherItem = shouldShowWrapEtherItem ? (
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
        ) : null;
        return (
            <div id={key} key={key} className={`flex flex-column ${className || ''}`}>
                {this.state.wrappedEtherDirection === Side.Receive && wrapEtherItem}
                <StandardIconRow
                    icon={icon}
                    main={
                        <div className="flex flex-column">
                            {primaryText}
                            <Container marginTop="3px">{secondaryText}</Container>
                        </div>
                    }
                    accessory={this._renderAccessoryItems(accessoryItemConfig)}
                />
                {this.state.wrappedEtherDirection === Side.Deposit && wrapEtherItem}
            </div>
        );
    }
    private _renderAccessoryItems(config: AccessoryItemConfig): React.ReactElement<{}> {
        const shouldShowWrappedEtherAction = config.wrappedEtherDirection !== undefined;
        const shouldShowToggle = config.allowanceStateToggleConfig !== undefined;
        // if we don't have a toggle, we still want some space to the right of the "wrap" button so that it aligns with
        // the "unwrap" button in the row below
        const isWrapEtherRow = shouldShowWrappedEtherAction && config.wrappedEtherDirection === Side.Deposit;
        const width = isWrapEtherRow ? WRAP_ROW_ALLOWANCE_TOGGLE_WIDTH : ALLOWANCE_TOGGLE_WIDTH;
        const toggle = (
            <Container className="flex justify-center" width={width}>
                {shouldShowToggle && this._renderAllowanceToggle(config.allowanceStateToggleConfig)}
            </Container>
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
    private _renderAllowanceToggle(config: AllowanceStateToggleConfig): React.ReactNode {
        // TODO: Error handling
        return (
            <AllowanceStateToggle
                blockchain={this.props.blockchain}
                token={config.token}
                tokenState={config.tokenState}
                tooltipDirection={this.props.toggleTooltipDirection}
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
                <PlaceHolder hideChildren={isLoading} fillColor={PLACEHOLDER_COLOR}>
                    <Text fontSize="16px" fontWeight="bold" lineHeight="1em">
                        0.00 XXX
                    </Text>
                </PlaceHolder>
            );
        } else {
            return <Balance amount={amount} decimals={decimals} symbol={symbol} />;
        }
    }
    private _renderValue(
        amount: BigNumber,
        decimals: number,
        price?: BigNumber,
        isLoading: boolean = false,
    ): React.ReactNode {
        const result = !isLoading
            ? price === undefined
                ? '--'
                : utils.getUsdValueFormattedAmount(amount, decimals, price)
            : '$0.00';
        return (
            <PlaceHolder hideChildren={isLoading} fillColor={PLACEHOLDER_COLOR}>
                <Text fontSize="14px" fontColor={colors.darkGrey} lineHeight="1em">
                    {result}
                </Text>
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
        const action =
            wrappedEtherDirection === Side.Deposit ? 'Wallet - Wrap ETH Opened' : 'Wallet - Unwrap WETH Opened';
        analytics.track(action);
        this.setState({
            wrappedEtherDirection,
        });
    }
    private _closeWrappedEtherActionRow(wrappedEtherDirection: Side): void {
        const action =
            wrappedEtherDirection === Side.Deposit ? 'Wallet - Wrap ETH Closed' : 'Wallet - Unwrap WETH Closed';
        analytics.track(action);
        this.setState({
            wrappedEtherDirection: undefined,
        });
    }
    private _getEthToken(): Token {
        return utils.getEthToken(this.props.tokenByAddress);
    }
    private _isBlockchainReady(): boolean {
        return this.props.blockchainIsLoaded && this.props.blockchain !== undefined;
    }
    private _getAccountState(): AccountState {
        return utils.getAccountState(
            this._isBlockchainReady(),
            this.props.providerType,
            this.props.injectedProviderName,
            this.props.userAddress,
        );
    }
}

// tslint:disable:max-file-line-count
