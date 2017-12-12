import {ZeroEx} from '0x.js';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import Divider from 'material-ui/Divider';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import {colors} from 'material-ui/styles';
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
import {LifeCycleRaisedButton} from 'ts/components/ui/lifecycle_raised_button';
import {trackedTokenStorage} from 'ts/local_storage/tracked_token_storage';
import {Dispatcher} from 'ts/redux/dispatcher';
import {
    OutdatedWrappedEther,
    TokenByAddress,
    TokenStateByAddress,
} from 'ts/types';
import {configs} from 'ts/utils/configs';
import {constants} from 'ts/utils/constants';
import {errorReporter} from 'ts/utils/error_reporter';
import {utils} from 'ts/utils/utils';

const PRECISION = 5;
const DATE_FORMAT = 'D/M/YY';
const ICON_DIMENSION = 40;
const ETHER_ICON_PATH = '/images/ether.png';
const OUTDATED_WETH_ICON_PATH = '/images/wrapped_eth_gray.png';
const ETHER_TOKEN_SYMBOL = 'WETH';

interface EthWrappersProps {
    networkId: number;
    blockchain: Blockchain;
    dispatcher: Dispatcher;
    tokenByAddress: TokenByAddress;
    tokenStateByAddress: TokenStateByAddress;
    userAddress: string;
    userEtherBalance: BigNumber;
}

interface EthWrappersState {}

export class EthWrappers extends React.Component<EthWrappersProps, EthWrappersState> {
    constructor(props: EthWrappersProps) {
        super(props);
        this.state = {};
    }
    public componentDidMount() {
        window.scrollTo(0, 0);
    }
    public render() {
        const tokens = _.values(this.props.tokenByAddress);
        const wethToken = _.find(tokens, {symbol: 'WETH'});
        const wethState = this.props.tokenStateByAddress[wethToken.address];
        const wethBalance = ZeroEx.toUnitAmount(wethState.balance, 18);
        return (
            <div className="clearfix lg-px4 md-px4 sm-px2" style={{minHeight: 600}}>
                <h3>ETH Wrapper</h3>
                <Divider />
                <div>
                    <div className="py2">
                        Wrap ETH into an ERC20-compliant Ether token
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
                                    <TableHeaderColumn>
                                        {'ETH <-> WETH'}
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
                                    <TableRowColumn style={{paddingLeft: 3}}>
                                        <LifeCycleRaisedButton
                                            labelReady="Wrap"
                                            labelLoading="Wrapping..."
                                            labelComplete="Wrapped!"
                                            onClickAsyncFn={this.wrapEthAsync.bind(this, true)}
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
                                    <TableRowColumn style={{paddingLeft: 3}}>
                                        <LifeCycleRaisedButton
                                            labelReady="Unwrap"
                                            labelLoading="Unwrapping..."
                                            labelComplete="Unwrapped!"
                                            onClickAsyncFn={this.unwrapEthAsync.bind(this, true)}
                                        />
                                    </TableRowColumn>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
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
                                <TableHeaderColumn>
                                    {'WETH -> ETH'}
                                </TableHeaderColumn>
                            </TableRow>
                        </TableHeader>
                        <TableBody displayRowCheckbox={false}>
                            {this.renderOutdatedWeths()}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }
    private renderOutdatedWeths() {
        const rows = _.map(configs.outdatedWrappedEthers, (outdatedWETH: OutdatedWrappedEther) => {
            const timestampMsRange = outdatedWETH.timestampMsRangeByNetworkId[this.props.networkId];
            const startMoment = moment(timestampMsRange.startTimestampMs);
            const endMoment = moment(timestampMsRange.endTimestampMs);
            return (
                <TableRow key={`weth-${outdatedWETH.address}`}>
                    <TableRowColumn className="py1">
                        <div className="flex">
                            <img
                                style={{width: ICON_DIMENSION, height: ICON_DIMENSION}}
                                src={OUTDATED_WETH_ICON_PATH}
                            />
                            <div className="mt2 ml2 sm-hide xs-hide">
                                {startMoment.format(DATE_FORMAT)}-{endMoment.format(DATE_FORMAT)}
                            </div>
                        </div>
                    </TableRowColumn>
                    <TableRowColumn>
                        0 WETH
                    </TableRowColumn>
                    <TableRowColumn style={{paddingLeft: 3}}>
                        <LifeCycleRaisedButton
                            labelReady="Unwrap"
                            labelLoading="Unwrapping..."
                            labelComplete="Unwrapped!"
                            onClickAsyncFn={this.unwrapEthAsync.bind(this, true)}
                        />
                    </TableRowColumn>
                </TableRow>
            );
        });
        return rows;
    }
    private async wrapEthAsync() {
        // TODO
    }
    private async unwrapEthAsync() {
        // TODO
    }
} // tslint:disable:max-file-line-count
