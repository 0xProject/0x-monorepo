import * as _ from 'lodash';
import * as React from 'react';
import BigNumber from 'bignumber.js';
import Toggle from 'material-ui/Toggle';
import {Blockchain} from 'ts/blockchain';
import {Dispatcher} from 'ts/redux/dispatcher';
import {Token, TokenState, BalanceErrs} from 'ts/types';
import {utils} from 'ts/utils/utils';
import {errorReporter} from 'ts/utils/error_reporter';

const DEFAULT_ALLOWANCE_AMOUNT_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1);

interface AllowanceToggleProps {
    blockchain: Blockchain;
    dispatcher: Dispatcher;
    onErrorOccurred: (errType: BalanceErrs) => void;
    token: Token;
    tokenState: TokenState;
    userAddress: string;
}

interface AllowanceToggleState {
    isSpinnerVisible: boolean;
    prevAllowance: BigNumber;
}

export class AllowanceToggle extends React.Component<AllowanceToggleProps, AllowanceToggleState> {
    constructor(props: AllowanceToggleProps) {
        super(props);
        this.state = {
            isSpinnerVisible: false,
            prevAllowance: props.tokenState.allowance,
        };
    }
    public componentWillReceiveProps(nextProps: AllowanceToggleProps) {
        if (!nextProps.tokenState.allowance.eq(this.state.prevAllowance)) {
            this.setState({
                isSpinnerVisible: false,
                prevAllowance: nextProps.tokenState.allowance,
            });
        }
    }
    public render() {
        return (
            <div className="flex">
                <div>
                    <Toggle
                        disabled={this.state.isSpinnerVisible}
                        toggled={this.isAllowanceSet()}
                        onToggle={this.onToggleAllowanceAsync.bind(this, this.props.token)}
                    />
                </div>
                {this.state.isSpinnerVisible &&
                    <div className="pl1" style={{paddingTop: 3}}>
                        <i className="zmdi zmdi-spinner zmdi-hc-spin" />
                    </div>
                }
            </div>
        );
    }
    private async onToggleAllowanceAsync() {
        if (this.props.userAddress === '') {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            return false;
        }

        this.setState({
            isSpinnerVisible: true,
        });

        let newAllowanceAmountInBaseUnits = new BigNumber(0);
        if (!this.isAllowanceSet()) {
            newAllowanceAmountInBaseUnits = DEFAULT_ALLOWANCE_AMOUNT_IN_BASE_UNITS;
        }
        try {
            await this.props.blockchain.setProxyAllowanceAsync(this.props.token, newAllowanceAmountInBaseUnits);
        } catch (err) {
            this.setState({
                isSpinnerVisible: false,
            });
            const errMsg = '' + err;
            if (_.includes(errMsg, 'User denied transaction')) {
                return false;
            }
            utils.consoleLog(`Unexpected error encountered: ${err}`);
            utils.consoleLog(err.stack);
            await errorReporter.reportAsync(err);
            this.props.onErrorOccurred(BalanceErrs.allowanceSettingFailed);
        }
    }
    private isAllowanceSet() {
        return !this.props.tokenState.allowance.eq(0);
    }
}
