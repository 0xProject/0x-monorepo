import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import Toggle from 'material-ui/Toggle';
import * as React from 'react';
import * as ReactGA from 'react-ga';
import { Blockchain } from 'ts/blockchain';
import { Dispatcher } from 'ts/redux/dispatcher';
import { BalanceErrs, Token, TokenState } from 'ts/types';
import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';

const DEFAULT_ALLOWANCE_AMOUNT_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1);

interface AllowanceToggleProps {
    blockchain: Blockchain;
    dispatcher: Dispatcher;
    onErrorOccurred: (errType: BalanceErrs) => void;
    token: Token;
    tokenState: TokenState;
    userAddress: string;
    isDisabled: boolean;
    refetchTokenStateAsync: () => Promise<void>;
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
                        disabled={this.state.isSpinnerVisible || this.props.isDisabled}
                        toggled={this._isAllowanceSet()}
                        onToggle={this._onToggleAllowanceAsync.bind(this)}
                    />
                </div>
                {this.state.isSpinnerVisible && (
                    <div className="pl1" style={{ paddingTop: 3 }}>
                        <i className="zmdi zmdi-spinner zmdi-hc-spin" />
                    </div>
                )}
            </div>
        );
    }
    private async _onToggleAllowanceAsync(): Promise<void> {
        if (this.props.userAddress === '') {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
        }

        this.setState({
            isSpinnerVisible: true,
        });

        let newAllowanceAmountInBaseUnits = new BigNumber(0);
        if (!this._isAllowanceSet()) {
            newAllowanceAmountInBaseUnits = DEFAULT_ALLOWANCE_AMOUNT_IN_BASE_UNITS;
        }
        try {
            await this.props.blockchain.setProxyAllowanceAsync(this.props.token, newAllowanceAmountInBaseUnits)
            .then(() => {
                ReactGA.event({
                    category: 'Portal',
                    action: 'Set Allowance Success',
                    label: this.props.token.symbol,
                    value: newAllowanceAmountInBaseUnits,
                });
            }, () => {
                ReactGA.event({
                    category: 'Portal',
                    action: 'Set Allowance Failure',
                    label: this.props.token.symbol,
                    value: newAllowanceAmountInBaseUnits,
                });
            });
            await this.props.refetchTokenStateAsync();
        } catch (err) {
            this.setState({
                isSpinnerVisible: false,
            });
            const errMsg = `${err}`;
            if (utils.didUserDenyWeb3Request(errMsg)) {
                return;
            }
            utils.consoleLog(`Unexpected error encountered: ${err}`);
            utils.consoleLog(err.stack);
            this.props.onErrorOccurred(BalanceErrs.allowanceSettingFailed);
            await errorReporter.reportAsync(err);
        }
    }
    private _isAllowanceSet() {
        return !this.props.tokenState.allowance.eq(0);
    }
}
