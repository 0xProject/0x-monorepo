import { colors } from '@0xproject/react-shared';
import * as React from 'react';
import { AllowanceStateView, AllowanceState } from 'ts/components/ui/allowance_state_view';
import { Token, TokenState } from 'ts/types';
import ReactTooltip = require('react-tooltip');

export interface AllowanceStateToggleProps {}

export interface AllowanceStateToggleState {
    allowanceState: AllowanceState;
    token?: Token;
    tokenState?: TokenState;
}

const TOOLTIP_ID = 'AllowanceStateToggleTooltip';

const flip = () => Math.random() < 0.5;

export class AllowanceStateToggle extends React.Component<AllowanceStateToggleProps, AllowanceStateToggleState> {
    public state = {
        allowanceState: flip() ? AllowanceState.Loading : AllowanceState.Locked,
    };
    public render(): React.ReactNode {
        return (
            <div>
                <ReactTooltip id={TOOLTIP_ID}>{this._getTooltipContent()}</ReactTooltip>
                <div data-tip={true} data-for={TOOLTIP_ID} data-place="right" data-effect="solid">
                    <AllowanceStateView allowanceState={this.state.allowanceState} />
                </div>
            </div>
        );
    }
    private _getTooltipContent(): React.ReactNode {
        switch (this.state.allowanceState) {
            case AllowanceState.Loading:
                // TODO: support both awaiting confirmation and awaiting transaction.
                return 'Please confirm in MetaMask';
            case AllowanceState.Locked:
                return (
                    <span>
                        Click to enable <b>WETH</b> for trading
                    </span>
                );
            case AllowanceState.Unlocked:
                return (
                    <span>
                        <b>WETH</b> is available for trading
                    </span>
                );
            default:
                return null;
        }
    }
}
