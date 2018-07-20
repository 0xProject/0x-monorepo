import { BigNumber, logUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import * as React from 'react';
import ReactTooltip = require('react-tooltip');
import { Blockchain } from 'ts/blockchain';
import { AllowanceState, AllowanceStateView } from 'ts/components/ui/allowance_state_view';
import { Container } from 'ts/components/ui/container';
import { Dispatcher } from 'ts/redux/dispatcher';
import { BalanceErrs, Token, TokenState } from 'ts/types';
import { analytics } from 'ts/utils/analytics';
import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';

export interface AllowanceStateToggleProps {
    networkId: number;
    blockchain: Blockchain;
    dispatcher: Dispatcher;
    token: Token;
    tokenState: TokenState;
    userAddress: string;
    onErrorOccurred?: (errType: BalanceErrs) => void;
    refetchTokenStateAsync: () => Promise<void>;
}

export interface AllowanceStateToggleState {
    allowanceState: AllowanceState;
    prevAllowance: BigNumber;
}

const DEFAULT_ALLOWANCE_AMOUNT_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1);

export class AllowanceStateToggle extends React.Component<AllowanceStateToggleProps, AllowanceStateToggleState> {
    public static defaultProps = {
        onErrorOccurred: _.noop.bind(_),
    };
    private static _getAllowanceStateFromAllowance(allowance?: BigNumber): AllowanceState {
        if (_.isUndefined(allowance)) {
            return AllowanceState.Loading;
        }
        if (allowance.gt(0)) {
            return AllowanceState.Unlocked;
        }
        return AllowanceState.Locked;
    }
    constructor(props: AllowanceStateToggleProps) {
        super(props);
        const allowance = props.tokenState.allowance;
        this.state = {
            allowanceState: AllowanceState.Loading,
            prevAllowance: allowance,
        };
    }

    public render(): React.ReactNode {
        const tooltipId = `tooltip-id-${this.props.token.symbol}`;
        return (
            <Container cursor="pointer">
                <ReactTooltip id={tooltipId}>{this._getTooltipContent()}</ReactTooltip>
                <div
                    data-tip={true}
                    data-for={tooltipId}
                    data-place="right"
                    data-effect="solid"
                    onClick={this._onToggleAllowanceAsync.bind(this)}
                >
                    <AllowanceStateView allowanceState={this.state.allowanceState} />
                </div>
            </Container>
        );
    }
    public componentWillReceiveProps(nextProps: AllowanceStateToggleProps): void {
        if (!nextProps.tokenState.allowance.eq(this.state.prevAllowance)) {
            const allowance = nextProps.tokenState.allowance;
            this.setState({
                prevAllowance: allowance,
                allowanceState: AllowanceStateToggle._getAllowanceStateFromAllowance(allowance),
            });
        }
    }
    private _getTooltipContent(): React.ReactNode {
        const symbol = this.props.token.symbol;
        switch (this.state.allowanceState) {
            case AllowanceState.Loading:
                // TODO: support both awaiting confirmation and awaiting transaction.
                return 'Please confirm in MetaMask';
            case AllowanceState.Locked:
                return (
                    <span>
                        Click to enable <b>{symbol}</b> for trading
                    </span>
                );
            case AllowanceState.Unlocked:
                return (
                    <span>
                        <b>{symbol}</b> is available for trading
                    </span>
                );
            default:
                return null;
        }
    }
    private async _onToggleAllowanceAsync(): Promise<void> {
        if (this.props.userAddress === '') {
            this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            return;
        }

        this.setState({
            allowanceState: AllowanceState.Loading,
        });

        let newAllowanceAmountInBaseUnits = new BigNumber(0);
        if (!this._isAllowanceSet()) {
            newAllowanceAmountInBaseUnits = DEFAULT_ALLOWANCE_AMOUNT_IN_BASE_UNITS;
        }
        const logData = {
            tokenSymbol: this.props.token.symbol,
            newAllowance: newAllowanceAmountInBaseUnits.toNumber(),
        };
        try {
            await this.props.blockchain.setProxyAllowanceAsync(this.props.token, newAllowanceAmountInBaseUnits);
            analytics.track('Set Allowances Success', logData);
            await this.props.refetchTokenStateAsync();
        } catch (err) {
            analytics.track('Set Allowance Failure', logData);
            this.setState({
                allowanceState: AllowanceStateToggle._getAllowanceStateFromAllowance(this.state.prevAllowance),
            });
            const errMsg = `${err}`;
            if (utils.didUserDenyWeb3Request(errMsg)) {
                return;
            }
            logUtils.log(`Unexpected error encountered: ${err}`);
            logUtils.log(err.stack);
            this.props.onErrorOccurred(BalanceErrs.allowanceSettingFailed);
            errorReporter.report(err);
        }
    }
    private _isAllowanceSet(): boolean {
        return !this.props.tokenState.allowance.eq(0);
    }
}
