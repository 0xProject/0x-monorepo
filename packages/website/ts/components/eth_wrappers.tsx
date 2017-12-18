import {ZeroEx} from '0x.js';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import Divider from 'material-ui/Divider';
import {colors} from 'ts/utils/colors';
import {
    Table,
    TableBody,
    TableHeader,
    TableHeaderColumn,
    TableRow,
    TableRowColumn,
} from 'material-ui/Table';
import * as moment from 'moment';
import * as React from 'react';
import {Blockchain} from 'ts/blockchain';
import {EthWethConversionButton} from 'ts/components/eth_weth_conversion_button';
import {Dispatcher} from 'ts/redux/dispatcher';
import {
    OutdatedWrappedEtherByNetworkId,
    Side,
    Token,
    TokenByAddress,
    TokenState,
    TokenStateByAddress,
} from 'ts/types';
import {configs} from 'ts/utils/configs';
import {constants} from 'ts/utils/constants';

const PRECISION = 5;
const DATE_FORMAT = 'D/M/YY';
const ICON_DIMENSION = 40;
const ETHER_ICON_PATH = '/images/ether.png';
const OUTDATED_WETH_ICON_PATH = '/images/wrapped_eth_gray.png';

interface OutdatedWETHAddressToIsStateLoaded {
    [address: string]: boolean;
}
interface OutdatedWETHStateByAddress {
    [address: string]: TokenState;
}

interface EthWrappersProps {
    networkId: number;
    blockchain: Blockchain;
    dispatcher: Dispatcher;
    tokenByAddress: TokenByAddress;
    tokenStateByAddress: TokenStateByAddress;
    userAddress: string;
    userEtherBalance: BigNumber;
}

interface EthWrappersState {
    outdatedWETHAddressToIsStateLoaded: OutdatedWETHAddressToIsStateLoaded;
    outdatedWETHStateByAddress: OutdatedWETHStateByAddress;
}

export class EthWrappers extends React.Component<EthWrappersProps, EthWrappersState> {
    constructor(props: EthWrappersProps) {
        super(props);
        const outdatedWETHAddresses = this.getOutdatedWETHAddresses();
        const outdatedWETHAddressToIsStateLoaded: OutdatedWETHAddressToIsStateLoaded = {};
        const outdatedWETHStateByAddress: OutdatedWETHStateByAddress = {};
        _.each(outdatedWETHAddresses, outdatedWETHAddress => {
            outdatedWETHAddressToIsStateLoaded[outdatedWETHAddress] = false;
            outdatedWETHStateByAddress[outdatedWETHAddress] = {
                balance: new BigNumber(0),
                allowance: new BigNumber(0),
            };
        });
        this.state = {
            outdatedWETHAddressToIsStateLoaded,
            outdatedWETHStateByAddress,
        };
    }
    public componentDidMount() {
        window.scrollTo(0, 0);
        // tslint:disable-next-line:no-floating-promises
        this.fetchOutdatedWETHStateAsync();
    }
    public render() {
        const tokens = _.values(this.props.tokenByAddress);
        const etherToken = _.find(tokens, {symbol: 'WETH'});
        const etherTokenState = this.props.tokenStateByAddress[etherToken.address];
        const wethBalance = ZeroEx.toUnitAmount(etherTokenState.balance, 18);
        const isBidirectional = true;
        return (
            <div className="clearfix lg-px4 md-px4 sm-px2" style={{minHeight: 600}}>
                <div className="relative">
                    <h3>ETH Wrapper</h3>
                    <div className="absolute" style={{top: 0, right: 0}}>
                        <a
                            target="_blank"
                            href="https://weth.io/"
                            style={{color: colors.gray}}
                        >
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
                    <div className="py2">
                        Wrap ETH into an ERC20-compliant Ether token. 1 ETH = 1 WETH.
                    </div>
                    <div>
                        <Table
                            selectable={false}
                            style={{backgroundColor: colors.grey50}}
                        >
                            <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                                <TableRow>
                                    <TableHeaderColumn>ETH Token</TableHeaderColumn>
                                    <TableHeaderColumn>Balance</TableHeaderColumn>
                                    <TableHeaderColumn className="center">
                                        {this.renderActionColumnTitle(isBidirectional)}
                                    </TableHeaderColumn>
                                </TableRow>
                            </TableHeader>
                            <TableBody displayRowCheckbox={false}>
                                <TableRow key="ETH">
                                    <TableRowColumn className="py1">
                                        <div className="flex">
                                            <img
                                                style={{width: ICON_DIMENSION, height: ICON_DIMENSION}}
                                                src={ETHER_ICON_PATH}
                                            />
                                            <div className="mt2 ml2 sm-hide xs-hide">
                                                Ether
                                            </div>
                                        </div>
                                    </TableRowColumn>
                                    <TableRowColumn>
                                        {this.props.userEtherBalance.toFixed(PRECISION)} ETH
                                    </TableRowColumn>
                                    <TableRowColumn>
                                        <EthWethConversionButton
                                            isOutdatedWrappedEther={false}
                                            direction={Side.Deposit}
                                            ethToken={etherToken}
                                            ethTokenState={etherTokenState}
                                            dispatcher={this.props.dispatcher}
                                            blockchain={this.props.blockchain}
                                            userEtherBalance={this.props.userEtherBalance}
                                        />
                                    </TableRowColumn>
                                </TableRow>
                                <TableRow key="WETH">
                                    <TableRowColumn className="py1">
                                        <div className="flex">
                                            <img
                                                style={{width: ICON_DIMENSION, height: ICON_DIMENSION}}
                                                src={constants.iconUrlBySymbol.WETH}
                                            />
                                            <div className="mt2 ml2 sm-hide xs-hide">
                                                Wrapped Ether
                                            </div>
                                        </div>
                                    </TableRowColumn>
                                    <TableRowColumn>
                                        {wethBalance.toFixed(PRECISION)} WETH
                                    </TableRowColumn>
                                    <TableRowColumn>
                                        <EthWethConversionButton
                                            isOutdatedWrappedEther={false}
                                            direction={Side.Receive}
                                            ethToken={etherToken}
                                            ethTokenState={etherTokenState}
                                            dispatcher={this.props.dispatcher}
                                            blockchain={this.props.blockchain}
                                            userEtherBalance={this.props.userEtherBalance}
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
                    <div className="pt2" style={{lineHeight: 1.5}}>
                        The{' '}
                        <a
                            href="https://blog.0xproject.com/canonical-weth-a9aa7d0279dd"
                            target="_blank"
                        >
                            canonical WETH
                        </a> contract is updated when necessary.
                        Unwrap outdated WETH in order to  retrieve your ETH and move it
                        to the updated WETH token.
                    </div>
                    <div>
                        <Table
                            selectable={false}
                            style={{backgroundColor: colors.grey50}}
                        >
                            <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                                <TableRow>
                                    <TableHeaderColumn>WETH Version</TableHeaderColumn>
                                    <TableHeaderColumn>Balance</TableHeaderColumn>
                                    <TableHeaderColumn className="center">
                                        {this.renderActionColumnTitle(!isBidirectional)}
                                    </TableHeaderColumn>
                                </TableRow>
                            </TableHeader>
                            <TableBody displayRowCheckbox={false}>
                                {this.renderOutdatedWeths(etherToken, etherTokenState)}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        );
    }
    private renderActionColumnTitle(isBidirectional: boolean) {
        let iconClass = 'zmdi-long-arrow-right';
        let leftSymbol = 'WETH';
        let rightSymbol = 'ETH';
        if (isBidirectional) {
            iconClass = 'zmdi-swap';
            leftSymbol = 'ETH';
            rightSymbol = 'WETH';
        }
        return (
            <div className="flex mx-auto" style={{width: 85}}>
                <div style={{paddingTop: 3}}>{leftSymbol}</div>
                <div className="px1">
                    <i
                        style={{fontSize: 18}}
                        className={`zmdi ${iconClass}`}
                    />
                </div>
                <div style={{paddingTop: 3}}>{rightSymbol}</div>
            </div>
        );
    }
    private renderOutdatedWeths(etherToken: Token, etherTokenState: TokenState) {
        const rows = _.map(configs.outdatedWrappedEthers,
                        (outdatedWETHByNetworkId: OutdatedWrappedEtherByNetworkId) => {
            const outdatedWETH = outdatedWETHByNetworkId[this.props.networkId];
            const timestampMsRange = outdatedWETH.timestampMsRange;
            let dateRange: string;
            if (!_.isUndefined(timestampMsRange)) {
                const startMoment = moment(timestampMsRange.startTimestampMs);
                const endMoment = moment(timestampMsRange.endTimestampMs);
                dateRange = `${startMoment.format(DATE_FORMAT)}-${endMoment.format(DATE_FORMAT)}`;
            } else {
                dateRange = '-';
            }
            const outdatedEtherToken = {
                ...etherToken,
                address: outdatedWETH.address,
            };
            const isStateLoaded = this.state.outdatedWETHAddressToIsStateLoaded[outdatedWETH.address];
            const outdatedEtherTokenState = this.state.outdatedWETHStateByAddress[outdatedWETH.address];
            const balanceInEthIfExists = isStateLoaded ?
                                         ZeroEx.toUnitAmount(outdatedEtherTokenState.balance, 18).toFixed(PRECISION) :
                                         undefined;
            const onConversionSuccessful = this.onOutdatedConversionSuccessfulAsync.bind(this, outdatedWETH.address);
            return (
                <TableRow key={`weth-${outdatedWETH.address}`}>
                    <TableRowColumn className="py1">
                        <div className="flex">
                            <img
                                style={{width: ICON_DIMENSION, height: ICON_DIMENSION}}
                                src={OUTDATED_WETH_ICON_PATH}
                            />
                            <div className="mt2 ml2 sm-hide xs-hide">
                                {dateRange}
                            </div>
                        </div>
                    </TableRowColumn>
                    <TableRowColumn>
                        {isStateLoaded ?
                            `${balanceInEthIfExists} WETH` :
                            <i className="zmdi zmdi-spinner zmdi-hc-spin" />
                        }
                    </TableRowColumn>
                    <TableRowColumn>
                        <EthWethConversionButton
                            isDisabled={!isStateLoaded}
                            isOutdatedWrappedEther={true}
                            direction={Side.Receive}
                            ethToken={outdatedEtherToken}
                            ethTokenState={outdatedEtherTokenState}
                            dispatcher={this.props.dispatcher}
                            blockchain={this.props.blockchain}
                            userEtherBalance={this.props.userEtherBalance}
                            onConversionSuccessful={onConversionSuccessful}
                        />
                    </TableRowColumn>
                </TableRow>
            );
        });
        return rows;
    }
    private async onOutdatedConversionSuccessfulAsync(outdatedWETHAddress: string) {
        this.setState({
            outdatedWETHAddressToIsStateLoaded: {
                ...this.state.outdatedWETHAddressToIsStateLoaded,
                [outdatedWETHAddress]: false,
            },
        });
        const [balance, allowance] = await this.props.blockchain.getTokenBalanceAndAllowanceAsync(
            this.props.userAddress, outdatedWETHAddress,
        );
        this.setState({
            outdatedWETHAddressToIsStateLoaded: {
                ...this.state.outdatedWETHAddressToIsStateLoaded,
                [outdatedWETHAddress]: true,
            },
            outdatedWETHStateByAddress: {
                ...this.state.outdatedWETHStateByAddress,
                [outdatedWETHAddress]: {
                    balance,
                    allowance,
                },
            },
        });
    }
    private async fetchOutdatedWETHStateAsync() {
        const outdatedWETHAddresses = this.getOutdatedWETHAddresses();
        const outdatedWETHAddressToIsStateLoaded: OutdatedWETHAddressToIsStateLoaded = {};
        const outdatedWETHStateByAddress: OutdatedWETHStateByAddress = {};
        for (const address of outdatedWETHAddresses) {
            const [balance, allowance] = await this.props.blockchain.getTokenBalanceAndAllowanceAsync(
                this.props.userAddress, address,
            );
            outdatedWETHStateByAddress[address] = {
                balance,
                allowance,
            };
            outdatedWETHAddressToIsStateLoaded[address] = true;
        }
        this.setState({
            outdatedWETHStateByAddress,
            outdatedWETHAddressToIsStateLoaded,
        });
    }
    private getOutdatedWETHAddresses(): string[] {
        const outdatedWETHAddresses = _.map(configs.outdatedWrappedEthers, outdatedWrappedEther => {
            return outdatedWrappedEther[this.props.networkId].address;
        });
        return outdatedWETHAddresses;
    }
} // tslint:disable:max-file-line-count
