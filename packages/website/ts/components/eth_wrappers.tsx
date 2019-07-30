import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import Divider from 'material-ui/Divider';
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui/Table';
import * as moment from 'moment';
import * as React from 'react';
import ReactTooltip from 'react-tooltip';
import { Blockchain } from 'ts/blockchain';
import { EthWethConversionButton } from 'ts/components/eth_weth_conversion_button';
import { Dispatcher } from 'ts/redux/dispatcher';
import {
    EtherscanLinkSuffixes,
    OutdatedWrappedEtherByNetworkId,
    Side,
    Token,
    TokenByAddress,
    TokenState,
    TokenStateByAddress,
} from 'ts/types';
import { colors } from 'ts/utils/colors';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

const DATE_FORMAT = 'D/M/YY';
const ICON_DIMENSION = 40;
const ETHER_ICON_PATH = '/images/ether.png';
const OUTDATED_WETH_ICON_PATH = '/images/wrapped_eth_gray.png';

interface EthWrappersProps {
    networkId: number;
    blockchain: Blockchain;
    dispatcher: Dispatcher;
    tokenByAddress: TokenByAddress;
    userAddress: string;
    userEtherBalanceInWei?: BigNumber;
    lastForceTokenStateRefetch: number;
    isFullWidth?: boolean;
}

interface EthWrappersState {
    ethTokenState: TokenState;
    outdatedWETHStateByAddress: TokenStateByAddress;
}

export class EthWrappers extends React.Component<EthWrappersProps, EthWrappersState> {
    public static defaultProps: Partial<EthWrappersProps> = {
        isFullWidth: false,
    };
    private _isUnmounted: boolean;
    constructor(props: EthWrappersProps) {
        super(props);
        this._isUnmounted = false;
        const outdatedWETHAddresses = this._getOutdatedWETHAddresses();
        const outdatedWETHStateByAddress: TokenStateByAddress = {};
        _.each(outdatedWETHAddresses, outdatedWETHAddress => {
            outdatedWETHStateByAddress[outdatedWETHAddress] = {
                balance: new BigNumber(0),
                allowance: new BigNumber(0),
                isLoaded: false,
            };
        });
        this.state = {
            outdatedWETHStateByAddress,
            ethTokenState: {
                balance: new BigNumber(0),
                allowance: new BigNumber(0),
                isLoaded: false,
            },
        };
    }
    public componentWillReceiveProps(nextProps: EthWrappersProps): void {
        if (
            nextProps.userAddress !== this.props.userAddress ||
            nextProps.networkId !== this.props.networkId ||
            nextProps.lastForceTokenStateRefetch !== this.props.lastForceTokenStateRefetch
        ) {
            // tslint:disable-next-line:no-floating-promises
            this._fetchWETHStateAsync();
        }
    }
    public componentDidMount(): void {
        window.scrollTo(0, 0);
        // tslint:disable-next-line:no-floating-promises
        this._fetchWETHStateAsync();
    }
    public componentWillUnmount(): void {
        this._isUnmounted = true;
    }
    public render(): React.ReactNode {
        const etherToken = this._getEthToken();
        const wethBalance = Web3Wrapper.toUnitAmount(this.state.ethTokenState.balance, constants.DECIMAL_PLACES_ETH);
        const isBidirectional = true;
        const etherscanUrl = utils.getEtherScanLinkIfExists(
            etherToken.address,
            this.props.networkId,
            EtherscanLinkSuffixes.Address,
        );
        const tokenLabel = this._renderToken(
            'Wrapped Ether',
            etherToken.address,
            utils.getTokenIconUrl(etherToken.symbol),
        );
        const userEtherBalanceInEth =
            this.props.userEtherBalanceInWei !== undefined
                ? Web3Wrapper.toUnitAmount(this.props.userEtherBalanceInWei, constants.DECIMAL_PLACES_ETH)
                : undefined;
        const rootClassName = this.props.isFullWidth ? 'clearfix' : 'clearfix lg-px4 md-px4 sm-px2';
        return (
            <div className={rootClassName} style={{ minHeight: 600 }}>
                <div className="relative">
                    <h3>ETH Wrapper</h3>
                    <div className="absolute" style={{ top: 0, right: 0 }}>
                        <a target="_blank" href={constants.URL_WETH_IO} style={{ color: colors.grey }}>
                            <div className="flex">
                                <div>About Wrapped ETH</div>
                                <div className="pl1">
                                    <i className="zmdi zmdi-open-in-new" />
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
                <Divider />
                <div>
                    <div className="py2">Wrap ETH into an ERC20-compliant Ether token. 1 ETH = 1 WETH.</div>
                    <div>
                        <Table selectable={false} style={{ backgroundColor: 'transparent' }}>
                            <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                                <TableRow>
                                    <TableHeaderColumn>ETH Token</TableHeaderColumn>
                                    <TableHeaderColumn>Balance</TableHeaderColumn>
                                    <TableHeaderColumn className="center">
                                        {this._renderActionColumnTitle(isBidirectional)}
                                    </TableHeaderColumn>
                                </TableRow>
                            </TableHeader>
                            <TableBody displayRowCheckbox={false}>
                                <TableRow key="ETH">
                                    <TableRowColumn className="py1">
                                        <div className="flex">
                                            <img
                                                style={{
                                                    width: ICON_DIMENSION,
                                                    height: ICON_DIMENSION,
                                                }}
                                                src={ETHER_ICON_PATH}
                                            />
                                            <div className="ml2 sm-hide xs-hide" style={{ marginTop: 12 }}>
                                                ETH
                                            </div>
                                        </div>
                                    </TableRowColumn>
                                    <TableRowColumn>
                                        {userEtherBalanceInEth !== undefined ? (
                                            `${userEtherBalanceInEth.toFixed(configs.AMOUNT_DISPLAY_PRECSION)} ETH`
                                        ) : (
                                            <i className="zmdi zmdi-spinner zmdi-hc-spin" />
                                        )}
                                    </TableRowColumn>
                                    <TableRowColumn>
                                        <EthWethConversionButton
                                            refetchEthTokenStateAsync={this._refetchEthTokenStateAsync.bind(this)}
                                            lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                                            userAddress={this.props.userAddress}
                                            networkId={this.props.networkId}
                                            isOutdatedWrappedEther={false}
                                            direction={Side.Deposit}
                                            ethToken={etherToken}
                                            dispatcher={this.props.dispatcher}
                                            blockchain={this.props.blockchain}
                                            userEtherBalanceInWei={this.props.userEtherBalanceInWei}
                                            isDisabled={userEtherBalanceInEth === undefined}
                                        />
                                    </TableRowColumn>
                                </TableRow>
                                <TableRow key="WETH">
                                    <TableRowColumn className="py1">
                                        {this._renderTokenLink(tokenLabel, etherscanUrl)}
                                    </TableRowColumn>
                                    <TableRowColumn>
                                        {this.state.ethTokenState.isLoaded ? (
                                            `${wethBalance.toFixed(configs.AMOUNT_DISPLAY_PRECSION)} WETH`
                                        ) : (
                                            <i className="zmdi zmdi-spinner zmdi-hc-spin" />
                                        )}
                                    </TableRowColumn>
                                    <TableRowColumn>
                                        <EthWethConversionButton
                                            refetchEthTokenStateAsync={this._refetchEthTokenStateAsync.bind(this)}
                                            lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                                            userAddress={this.props.userAddress}
                                            networkId={this.props.networkId}
                                            isOutdatedWrappedEther={false}
                                            direction={Side.Receive}
                                            isDisabled={!this.state.ethTokenState.isLoaded}
                                            ethToken={etherToken}
                                            dispatcher={this.props.dispatcher}
                                            blockchain={this.props.blockchain}
                                            userEtherBalanceInWei={this.props.userEtherBalanceInWei}
                                        />
                                    </TableRowColumn>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <div>
                    <h4>Outdated WETH</h4>
                    <Divider />
                    <div className="pt2" style={{ lineHeight: 1.5 }}>
                        The{' '}
                        <a href={constants.URL_CANONICAL_WETH_POST} target="_blank">
                            canonical WETH
                        </a>{' '}
                        contract is updated when necessary. Unwrap outdated WETH in order to  retrieve your ETH and move
                        it to the updated WETH token.
                    </div>
                    <div>
                        <Table selectable={false} style={{ backgroundColor: 'transparent' }}>
                            <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                                <TableRow>
                                    <TableHeaderColumn>WETH Version</TableHeaderColumn>
                                    <TableHeaderColumn>Balance</TableHeaderColumn>
                                    <TableHeaderColumn className="center">
                                        {this._renderActionColumnTitle(!isBidirectional)}
                                    </TableHeaderColumn>
                                </TableRow>
                            </TableHeader>
                            <TableBody displayRowCheckbox={false}>{this._renderOutdatedWeths(etherToken)}</TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        );
    }
    private _renderActionColumnTitle(isBidirectional: boolean): React.ReactNode {
        let iconClass = 'zmdi-long-arrow-right';
        let leftSymbol = 'WETH';
        let rightSymbol = 'ETH';
        if (isBidirectional) {
            iconClass = 'zmdi-swap';
            leftSymbol = 'ETH';
            rightSymbol = 'WETH';
        }
        return (
            <div className="flex mx-auto" style={{ width: 85 }}>
                <div style={{ paddingTop: 3 }}>{leftSymbol}</div>
                <div className="px1">
                    <i style={{ fontSize: 18 }} className={`zmdi ${iconClass}`} />
                </div>
                <div style={{ paddingTop: 3 }}>{rightSymbol}</div>
            </div>
        );
    }
    private _renderOutdatedWeths(etherToken: Token): React.ReactNode {
        const rows = _.map(
            configs.OUTDATED_WRAPPED_ETHERS,
            (outdatedWETHByNetworkId: OutdatedWrappedEtherByNetworkId) => {
                const outdatedWETHIfExists = outdatedWETHByNetworkId[this.props.networkId];
                if (outdatedWETHIfExists === undefined) {
                    return null; // noop
                }
                const timestampMsRange = outdatedWETHIfExists.timestampMsRange;
                let dateRange: string;
                if (timestampMsRange !== undefined) {
                    const startMoment = moment(timestampMsRange.startTimestampMs);
                    const endMoment = moment(timestampMsRange.endTimestampMs);
                    dateRange = `${startMoment.format(DATE_FORMAT)}-${endMoment.format(DATE_FORMAT)}`;
                } else {
                    dateRange = '-';
                }
                const outdatedEtherToken = {
                    ...etherToken,
                    address: outdatedWETHIfExists.address,
                };
                const outdatedEtherTokenState = this.state.outdatedWETHStateByAddress[outdatedWETHIfExists.address];
                const isStateLoaded = outdatedEtherTokenState.isLoaded;
                const balanceInEthIfExists = isStateLoaded
                    ? Web3Wrapper.toUnitAmount(outdatedEtherTokenState.balance, constants.DECIMAL_PLACES_ETH).toFixed(
                          configs.AMOUNT_DISPLAY_PRECSION,
                      )
                    : undefined;
                const onConversionSuccessful = this._onOutdatedConversionSuccessfulAsync.bind(
                    this,
                    outdatedWETHIfExists.address,
                );
                const etherscanUrl = utils.getEtherScanLinkIfExists(
                    outdatedWETHIfExists.address,
                    this.props.networkId,
                    EtherscanLinkSuffixes.Address,
                );
                const tokenLabel = this._renderToken(dateRange, outdatedEtherToken.address, OUTDATED_WETH_ICON_PATH);
                return (
                    <TableRow key={`weth-${outdatedWETHIfExists.address}`}>
                        <TableRowColumn className="py1">
                            {this._renderTokenLink(tokenLabel, etherscanUrl)}
                        </TableRowColumn>
                        <TableRowColumn>
                            {isStateLoaded ? (
                                `${balanceInEthIfExists} WETH`
                            ) : (
                                <i className="zmdi zmdi-spinner zmdi-hc-spin" />
                            )}
                        </TableRowColumn>
                        <TableRowColumn>
                            <EthWethConversionButton
                                refetchEthTokenStateAsync={this._refetchEthTokenStateAsync.bind(this)}
                                lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                                userAddress={this.props.userAddress}
                                networkId={this.props.networkId}
                                isDisabled={!isStateLoaded}
                                isOutdatedWrappedEther={true}
                                direction={Side.Receive}
                                ethToken={outdatedEtherToken}
                                dispatcher={this.props.dispatcher}
                                blockchain={this.props.blockchain}
                                userEtherBalanceInWei={this.props.userEtherBalanceInWei}
                                onConversionSuccessful={onConversionSuccessful}
                            />
                        </TableRowColumn>
                    </TableRow>
                );
            },
        );
        return rows;
    }
    private _renderTokenLink(tokenLabel: React.ReactNode, etherscanUrl: string): React.ReactNode {
        return (
            <span>
                {etherscanUrl === undefined ? (
                    tokenLabel
                ) : (
                    <a href={etherscanUrl} target="_blank" style={{ textDecoration: 'none' }}>
                        {tokenLabel}
                    </a>
                )}
            </span>
        );
    }
    private _renderToken(name: string, address: string, imgPath: string): React.ReactNode {
        const tooltipId = `tooltip-${address}`;
        return (
            <div className="flex">
                <img style={{ width: ICON_DIMENSION, height: ICON_DIMENSION }} src={imgPath} />
                <div className="ml2 sm-hide xs-hide" style={{ marginTop: 12 }}>
                    <span data-tip={true} data-for={tooltipId}>
                        {name}
                    </span>
                    <ReactTooltip id={tooltipId}>{address}</ReactTooltip>
                </div>
            </div>
        );
    }
    private async _onOutdatedConversionSuccessfulAsync(outdatedWETHAddress: string): Promise<void> {
        const currentOutdatedWETHState = this.state.outdatedWETHStateByAddress[outdatedWETHAddress];
        this.setState({
            outdatedWETHStateByAddress: {
                ...this.state.outdatedWETHStateByAddress,
                [outdatedWETHAddress]: {
                    balance: currentOutdatedWETHState.balance,
                    allowance: currentOutdatedWETHState.allowance,
                    isLoaded: false,
                },
            },
        });
        const userAddressIfExists = _.isEmpty(this.props.userAddress) ? undefined : this.props.userAddress;
        const [balance, allowance] = await this.props.blockchain.getTokenBalanceAndAllowanceAsync(
            userAddressIfExists,
            outdatedWETHAddress,
        );
        this.setState({
            outdatedWETHStateByAddress: {
                ...this.state.outdatedWETHStateByAddress,
                [outdatedWETHAddress]: {
                    balance,
                    allowance,
                    isLoaded: true,
                },
            },
        });
    }
    private async _fetchWETHStateAsync(): Promise<void> {
        const tokens = _.values(this.props.tokenByAddress);
        const wethToken = _.find(tokens, token => token.symbol === 'WETH');
        const userAddressIfExists = _.isEmpty(this.props.userAddress) ? undefined : this.props.userAddress;
        const [wethBalance, wethAllowance] = await this.props.blockchain.getTokenBalanceAndAllowanceAsync(
            userAddressIfExists,
            wethToken.address,
        );

        const outdatedWETHAddresses = this._getOutdatedWETHAddresses();
        const outdatedWETHStateByAddress: TokenStateByAddress = {};
        for (const address of outdatedWETHAddresses) {
            const [balance, allowance] = await this.props.blockchain.getTokenBalanceAndAllowanceAsync(
                userAddressIfExists,
                address,
            );
            outdatedWETHStateByAddress[address] = {
                balance,
                allowance,
                isLoaded: true,
            };
        }
        if (!this._isUnmounted) {
            this.setState({
                outdatedWETHStateByAddress,
                ethTokenState: {
                    balance: wethBalance,
                    allowance: wethAllowance,
                    isLoaded: true,
                },
            });
        }
    }
    private _getOutdatedWETHAddresses(): string[] {
        const outdatedWETHAddresses = _.compact(
            _.map(configs.OUTDATED_WRAPPED_ETHERS, outdatedWrappedEtherByNetwork => {
                const outdatedWrappedEtherIfExists = outdatedWrappedEtherByNetwork[this.props.networkId];
                if (outdatedWrappedEtherIfExists === undefined) {
                    return undefined;
                }
                const address = outdatedWrappedEtherIfExists.address;
                return address;
            }),
        );
        return outdatedWETHAddresses;
    }
    private _getEthToken(): Token {
        const tokens = _.values(this.props.tokenByAddress);
        const etherToken = _.find(tokens, { symbol: 'WETH' });
        return etherToken;
    }
    private async _refetchEthTokenStateAsync(): Promise<void> {
        const etherToken = this._getEthToken();
        const userAddressIfExists = _.isEmpty(this.props.userAddress) ? undefined : this.props.userAddress;
        const [balance, allowance] = await this.props.blockchain.getTokenBalanceAndAllowanceAsync(
            userAddressIfExists,
            etherToken.address,
        );
        this.setState({
            ethTokenState: {
                balance,
                allowance,
                isLoaded: true,
            },
        });
    }
} // tslint:disable:max-file-line-count
