import { colors } from '@0x/react-shared';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import TextField from 'material-ui/TextField';
import * as React from 'react';
import { RequiredLabel } from 'ts/components/ui/required_label';
import { ValidatedBigNumberCallback } from 'ts/types';
import { utils } from 'ts/utils/utils';

interface BalanceBoundedInputProps {
    label?: string;
    balance: BigNumber;
    amount?: BigNumber;
    hintText?: string;
    onChange: ValidatedBigNumberCallback;
    onErrorMsgChange?: (errorMsg: React.ReactNode) => void;
    shouldShowIncompleteErrs?: boolean;
    shouldCheckBalance: boolean;
    validate?: (amount: BigNumber) => React.ReactNode;
    isDisabled?: boolean;
    shouldShowErrs?: boolean;
    shouldShowUnderline?: boolean;
    inputStyle?: React.CSSProperties;
    inputHintStyle?: React.CSSProperties;
}

interface BalanceBoundedInputState {
    errMsg: React.ReactNode;
    amountString: string;
}

export class BalanceBoundedInput extends React.Component<BalanceBoundedInputProps, BalanceBoundedInputState> {
    public static defaultProps: Partial<BalanceBoundedInputProps> = {
        shouldShowIncompleteErrs: false,
        isDisabled: false,
        shouldShowErrs: true,
        hintText: 'amount',
        onErrorMsgChange: _.noop.bind(_),
        shouldShowUnderline: true,
    };
    constructor(props: BalanceBoundedInputProps) {
        super(props);
        const amountString = this.props.amount ? this.props.amount.toString() : '';
        this.state = {
            errMsg: this._validate(amountString, props.balance),
            amountString,
        };
    }
    public componentWillReceiveProps(nextProps: BalanceBoundedInputProps): void {
        if (nextProps === this.props) {
            return;
        }
        const isCurrentAmountNumeric = utils.isNumeric(this.state.amountString);
        if (!_.isUndefined(nextProps.amount)) {
            let shouldResetState = false;
            if (!isCurrentAmountNumeric) {
                shouldResetState = true;
            } else {
                const currentAmount = new BigNumber(this.state.amountString);
                if (!currentAmount.eq(nextProps.amount) || !nextProps.balance.eq(this.props.balance)) {
                    shouldResetState = true;
                }
            }
            if (shouldResetState) {
                const amountString = nextProps.amount.toString();
                this._setAmountState(amountString, nextProps.balance);
            }
        } else if (isCurrentAmountNumeric) {
            const amountString = '';
            this._setAmountState(amountString, nextProps.balance);
        }
    }
    public render(): React.ReactNode {
        let errorText;
        if (this.props.shouldShowErrs) {
            errorText =
                this.props.shouldShowIncompleteErrs && this.state.amountString === ''
                    ? 'This field is required'
                    : this.state.errMsg;
        }
        let label: React.ReactNode | string = '';
        if (!_.isUndefined(this.props.label)) {
            label = <RequiredLabel label={this.props.label} />;
        }
        return (
            <TextField
                fullWidth={true}
                floatingLabelText={label}
                floatingLabelFixed={true}
                floatingLabelStyle={{ color: colors.grey, width: 206 }}
                errorText={errorText}
                value={this.state.amountString}
                hintText={<span style={{ textTransform: 'capitalize' }}>{this.props.hintText}</span>}
                onChange={this._onValueChange.bind(this)}
                underlineStyle={{ width: 'calc(100% + 50px)' }}
                inputStyle={this.props.inputStyle}
                hintStyle={this.props.inputHintStyle}
                underlineShow={this.props.shouldShowUnderline}
                disabled={this.props.isDisabled}
            />
        );
    }
    private _onValueChange(_event: any, amountString: string): void {
        this._setAmountState(amountString, this.props.balance, () => {
            const isValid = _.isUndefined(this._validate(amountString, this.props.balance));
            const isPositiveNumber = utils.isNumeric(amountString) && !_.includes(amountString, '-');
            if (isPositiveNumber) {
                this.props.onChange(isValid, new BigNumber(amountString));
            } else {
                this.props.onChange(isValid);
            }
        });
    }
    private _validate(amountString: string, balance: BigNumber): React.ReactNode {
        if (!utils.isNumeric(amountString)) {
            return amountString !== '' ? 'Must be a number' : '';
        }
        const amount = new BigNumber(amountString);
        if (amount.eq(0)) {
            return 'Cannot be zero';
        }
        if (this.props.shouldCheckBalance && amount.gt(balance)) {
            return <span>Insufficient balance.</span>;
        }
        const errMsg = _.isUndefined(this.props.validate) ? undefined : this.props.validate(amount);
        return errMsg;
    }
    private _setAmountState(amount: string, balance: BigNumber, callback: () => void = _.noop.bind(_)): void {
        const errorMsg = this._validate(amount, balance);
        this.props.onErrorMsgChange(errorMsg);
        this.setState(
            {
                amountString: amount,
                errMsg: errorMsg,
            },
            callback,
        );
    }
}
