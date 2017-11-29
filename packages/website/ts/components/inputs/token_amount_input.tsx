import {ZeroEx} from '0x.js';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import {colors} from 'material-ui/styles';
import * as React from 'react';
import {Link} from 'react-router-dom';
import {BalanceBoundedInput} from 'ts/components/inputs/balance_bounded_input';
import {InputErrMsg, Token, TokenState, ValidatedBigNumberCallback, WebsitePaths} from 'ts/types';

interface TokenAmountInputProps {
    label: string;
    token: Token;
    tokenState: TokenState;
    amount?: BigNumber;
    shouldShowIncompleteErrs: boolean;
    shouldCheckBalance: boolean;
    shouldCheckAllowance: boolean;
    onChange: ValidatedBigNumberCallback;
    onVisitBalancesPageClick?: () => void;
}

interface  TokenAmountInputState {}

export class TokenAmountInput extends React.Component<TokenAmountInputProps, TokenAmountInputState> {
    public render() {
        const amount = this.props.amount ?
            ZeroEx.toUnitAmount(this.props.amount, this.props.token.decimals) :
            undefined;
        return (
            <div className="flex overflow-hidden" style={{height: 84}}>
                <BalanceBoundedInput
                    label={this.props.label}
                    amount={amount}
                    balance={ZeroEx.toUnitAmount(this.props.tokenState.balance, this.props.token.decimals)}
                    onChange={this.onChange.bind(this)}
                    validate={this.validate.bind(this)}
                    shouldCheckBalance={this.props.shouldCheckBalance}
                    shouldShowIncompleteErrs={this.props.shouldShowIncompleteErrs}
                    onVisitBalancesPageClick={this.props.onVisitBalancesPageClick}
                />
                <div style={{paddingTop: 39}}>
                    {this.props.token.symbol}
                </div>
            </div>
        );
    }
    private onChange(isValid: boolean, amount?: BigNumber) {
        let baseUnitAmount;
        if (!_.isUndefined(amount)) {
            baseUnitAmount = ZeroEx.toBaseUnitAmount(amount, this.props.token.decimals);
        }
        this.props.onChange(isValid, baseUnitAmount);
    }
    private validate(amount: BigNumber): InputErrMsg {
        if (this.props.shouldCheckAllowance && amount.gt(this.props.tokenState.allowance)) {
            return (
                <span>
                    Insufficient allowance.{' '}
                    <Link
                        to={`${WebsitePaths.Portal}/balances`}
                        style={{cursor: 'pointer', color: colors.grey900}}
                    >
                            Set allowance
                    </Link>
                </span>
            );
        }
    }
}
