import { colors, constants as sharedConstants, Styles } from '@0xproject/react-shared';
import { BigNumber, logUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import Toggle from 'material-ui/Toggle';
import * as React from 'react';
import { Blockchain } from 'ts/blockchain';
import { Dispatcher } from 'ts/redux/dispatcher';
import { BalanceErrs, Token, TokenState } from 'ts/types';
import { analytics } from 'ts/utils/analytics';
import { constants } from 'ts/utils/constants';
import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';

const DEFAULT_ALLOWANCE_AMOUNT_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1);

interface AllowanceToggleProps {
    networkId: number;
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

const styles: Styles = {
    baseThumbStyle: {
        height: 10,
        width: 10,
        top: 6,
        backgroundColor: colors.white,
        boxShadow: `0px 0px 0px ${colors.allowanceToggleShadow}`,
    },
    offThumbStyle: {
        left: 4,
    },
    onThumbStyle: {
        left: 25,
    },
    baseTrackStyle: {
        width: 25,
    },
    offTrackStyle: {
        backgroundColor: colors.allowanceToggleOffTrack,
    },
    onTrackStyle: {
        backgroundColor: colors.allowanceToggleOnTrack,
    },
};

export class AllowanceToggle extends React.Component<AllowanceToggleProps, AllowanceToggleState> {
    constructor(props: AllowanceToggleProps) {
        super(props);
        this.state = {
            isSpinnerVisible: false,
            prevAllowance: props.tokenState.allowance,
        };
    }
    public componentWillReceiveProps(nextProps: AllowanceToggleProps): void {
        if (!nextProps.tokenState.allowance.eq(this.state.prevAllowance)) {
            this.setState({
                isSpinnerVisible: false,
                prevAllowance: nextProps.tokenState.allowance,
            });
        }
    }
    public render(): React.ReactNode {
        return (
            <div className="flex">
                <div>
                    <Toggle
                        disabled={this.state.isSpinnerVisible || this.props.isDisabled}
                        toggled={this._isAllowanceSet()}
                        onToggle={this._onToggleAllowanceAsync.bind(this)}
                        thumbStyle={{ ...styles.baseThumbStyle, ...styles.offThumbStyle }}
                        thumbSwitchedStyle={{ ...styles.baseThumbStyle, ...styles.onThumbStyle }}
                        trackStyle={{ ...styles.baseTrackStyle, ...styles.offTrackStyle }}
                        trackSwitchedStyle={{ ...styles.baseTrackStyle, ...styles.onTrackStyle }}
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
            return;
        }

        this.setState({
            isSpinnerVisible: true,
        });

        let newAllowanceAmountInBaseUnits = new BigNumber(0);
        if (!this._isAllowanceSet()) {
            newAllowanceAmountInBaseUnits = DEFAULT_ALLOWANCE_AMOUNT_IN_BASE_UNITS;
        }
        const networkName = sharedConstants.NETWORK_NAME_BY_ID[this.props.networkId];
        const eventLabel = `${this.props.token.symbol}-${networkName}`;
        try {
            await this.props.blockchain.setProxyAllowanceAsync(this.props.token, newAllowanceAmountInBaseUnits);
            analytics.logEvent('Portal', 'Set Allowance Success', eventLabel, newAllowanceAmountInBaseUnits.toNumber());
            await this.props.refetchTokenStateAsync();
        } catch (err) {
            analytics.logEvent('Portal', 'Set Allowance Failure', eventLabel, newAllowanceAmountInBaseUnits.toNumber());
            this.setState({
                isSpinnerVisible: false,
            });
            const errMsg = `${err}`;
            if (utils.didUserDenyWeb3Request(errMsg)) {
                return;
            }
            logUtils.log(`Unexpected error encountered: ${err}`);
            logUtils.log(err.stack);
            this.props.onErrorOccurred(BalanceErrs.allowanceSettingFailed);
            await errorReporter.reportAsync(err);
        }
    }
    private _isAllowanceSet(): boolean {
        return !this.props.tokenState.allowance.eq(0);
    }
}
