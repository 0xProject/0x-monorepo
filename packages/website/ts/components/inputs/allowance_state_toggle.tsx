import { colors } from '@0xproject/react-shared';
import * as React from 'react';
import { AllowanceStateView, AllowanceState } from 'ts/components/ui/allowance_state_view';
import { Token, TokenState } from 'ts/types';
import { Container } from 'ts/components/ui/container';
import ReactTooltip = require('react-tooltip');

export interface AllowanceStateToggleProps {
    token: Token;
    tokenState: TokenState;
}

export interface AllowanceStateToggleState {
    allowanceState: AllowanceState;
}

const flip = () => Math.random() < 0.5;

export class AllowanceStateToggle extends React.Component<AllowanceStateToggleProps, AllowanceStateToggleState> {
    public state = {
        allowanceState: flip() ? AllowanceState.Loading : AllowanceState.Locked,
    };
    public render(): React.ReactNode {
        const tooltipId = `tooltip-id-${this.props.token.symbol}`;
        return (
            <Container cursor="pointer">
                <ReactTooltip id={tooltipId}>{this._getTooltipContent()}</ReactTooltip>
                <div data-tip={true} data-for={tooltipId} data-place="right" data-effect="solid">
                    <AllowanceStateView allowanceState={this.state.allowanceState} />
                </div>
            </Container>
        );
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
}
