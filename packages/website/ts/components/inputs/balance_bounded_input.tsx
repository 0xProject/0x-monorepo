import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import TextField from 'material-ui/TextField';
import * as React from 'react';
import {Link} from 'react-router-dom';
import {RequiredLabel} from 'ts/components/ui/required_label';
import {InputErrMsg, ValidatedBigNumberCallback, WebsitePaths} from 'ts/types';
import {colors} from 'ts/utils/colors';
import {utils} from 'ts/utils/utils';

interface BalanceBoundedInputProps {
    label?: string;
    balance: BigNumber;
    amount?: BigNumber;
    onChange: ValidatedBigNumberCallback;
    shouldShowIncompleteErrs?: boolean;
    shouldCheckBalance: boolean;
    validate?: (amount: BigNumber) => InputErrMsg;
    onVisitBalancesPageClick?: () => void;
    shouldHideVisitBalancesLink?: boolean;
}

interface BalanceBoundedInputState {
    errMsg: InputErrMsg;
    amountString: string;
}

export class BalanceBoundedInput extends
    React.Component<BalanceBoundedInputProps, BalanceBoundedInputState> {
    public static defaultProps: Partial<BalanceBoundedInputProps> = {
        shouldShowIncompleteErrs: false,
        shouldHideVisitBalancesLink: false,
    };
    constructor(props: BalanceBoundedInputProps) {
        super(props);
        const amountString = this.props.amount ? this.props.amount.toString() : '';
        this.state = {
            errMsg: this.validate(amountString, props.balance),
            amountString,
        };
    }
    public componentWillReceiveProps(nextProps: BalanceBoundedInputProps) {
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
                this.setState({
                    errMsg: this.validate(amountString, nextProps.balance),
                    amountString,
                });
            }
        } else if (isCurrentAmountNumeric) {
            const amountString = '';
            this.setState({
                errMsg: this.validate(amountString, nextProps.balance),
                amountString,
            });
        }
    }
    public render() {
        let errorText = this.state.errMsg;
        if (this.props.shouldShowIncompleteErrs && this.state.amountString === '') {
            errorText = 'This field is required';
        }
        let label: React.ReactNode|string = '';
        if (!_.isUndefined(this.props.label)) {
            label = <RequiredLabel label={this.props.label}/>;
        }
        return (
            <TextField
                fullWidth={true}
                floatingLabelText={label}
                floatingLabelFixed={true}
                floatingLabelStyle={{color: colors.grey, width: 206}}
                errorText={errorText}
                value={this.state.amountString}
                hintText={<span style={{textTransform: 'capitalize'}}>amount</span>}
                onChange={this.onValueChange.bind(this)}
                underlineStyle={{width: 'calc(100% + 50px)'}}
            />
        );
    }
    private onValueChange(e: any, amountString: string) {
        const errMsg = this.validate(amountString, this.props.balance);
        this.setState({
            amountString,
            errMsg,
        }, () => {
            const isValid = _.isUndefined(errMsg);
            if (utils.isNumeric(amountString)) {
                this.props.onChange(isValid, new BigNumber(amountString));
            } else {
                this.props.onChange(isValid);
            }
        });
    }
    private validate(amountString: string, balance: BigNumber): InputErrMsg {
        if (!utils.isNumeric(amountString)) {
            return amountString !== '' ? 'Must be a number' : '';
        }
        const amount = new BigNumber(amountString);
        if (amount.eq(0)) {
            return 'Cannot be zero';
        }
        if (this.props.shouldCheckBalance && amount.gt(balance)) {
            return (
                <span>
                    Insufficient balance.{' '}
                    {this.renderIncreaseBalanceLink()}
                </span>
            );
        }
        const errMsg = _.isUndefined(this.props.validate) ? undefined : this.props.validate(amount);
        return errMsg;
    }
    private renderIncreaseBalanceLink() {
        if (this.props.shouldHideVisitBalancesLink) {
            return null;
        }

        const increaseBalanceText = 'Increase balance';
        const linkStyle = {
            cursor: 'pointer',
            color: colors.darkestGrey,
            textDecoration: 'underline',
            display: 'inline',
        };
        if (_.isUndefined(this.props.onVisitBalancesPageClick)) {
            return (
                <Link
                    to={`${WebsitePaths.Portal}/balances`}
                    style={linkStyle}
                >
                    {increaseBalanceText}
                </Link>
            );
        } else {
            return (
                <div
                    onClick={this.props.onVisitBalancesPageClick}
                    style={linkStyle}
                >
                    {increaseBalanceText}
                </div>
            );
        }
    }
}
