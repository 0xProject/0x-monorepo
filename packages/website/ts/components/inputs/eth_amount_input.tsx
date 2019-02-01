import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import * as React from 'react';
import { BalanceBoundedInput } from 'ts/components/inputs/balance_bounded_input';
import { ValidatedBigNumberCallback } from 'ts/types';
import { constants } from 'ts/utils/constants';

interface EthAmountInputProps {
    label?: string;
    balance: BigNumber;
    amount?: BigNumber;
    hintText?: string;
    onChange: ValidatedBigNumberCallback;
    onErrorMsgChange?: (errorMsg: React.ReactNode) => void;
    shouldShowIncompleteErrs: boolean;
    shouldCheckBalance: boolean;
    shouldShowErrs?: boolean;
    shouldShowUnderline?: boolean;
    style?: React.CSSProperties;
    labelStyle?: React.CSSProperties;
    inputHintStyle?: React.CSSProperties;
}

interface EthAmountInputState {}

export class EthAmountInput extends React.Component<EthAmountInputProps, EthAmountInputState> {
    public static defaultProps: Partial<EthAmountInputProps> = {
        shouldShowErrs: true,
        shouldShowUnderline: true,
    };
    public render(): React.ReactNode {
        const amount = this.props.amount
            ? Web3Wrapper.toUnitAmount(this.props.amount, constants.DECIMAL_PLACES_ETH)
            : undefined;
        return (
            <div className="flex" style={this.props.style}>
                <BalanceBoundedInput
                    label={this.props.label}
                    balance={this.props.balance}
                    amount={amount}
                    onChange={this._onChange.bind(this)}
                    onErrorMsgChange={this.props.onErrorMsgChange}
                    shouldCheckBalance={this.props.shouldCheckBalance}
                    shouldShowIncompleteErrs={this.props.shouldShowIncompleteErrs}
                    hintText={this.props.hintText}
                    shouldShowErrs={this.props.shouldShowErrs}
                    shouldShowUnderline={this.props.shouldShowUnderline}
                    inputStyle={this.props.style}
                    inputHintStyle={this.props.inputHintStyle}
                />
                <div style={this._getLabelStyle()}>ETH</div>
            </div>
        );
    }
    private _onChange(isValid: boolean, amount?: BigNumber): void {
        const baseUnitAmountIfExists = _.isUndefined(amount)
            ? undefined
            : Web3Wrapper.toBaseUnitAmount(amount, constants.DECIMAL_PLACES_ETH);
        this.props.onChange(isValid, baseUnitAmountIfExists);
    }
    private _getLabelStyle(): React.CSSProperties {
        return this.props.labelStyle || { paddingTop: _.isUndefined(this.props.label) ? 15 : 40 };
    }
}
