import { ZeroEx } from '0x.js';
import { colors } from '@0xproject/react-shared';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Blockchain } from 'ts/blockchain';
import { BalanceBoundedInput } from 'ts/components/inputs/balance_bounded_input';
import { InputErrMsg, Token, ValidatedBigNumberCallback, WebsitePaths } from 'ts/types';

interface TokenAmountInputProps {
    userAddress: string;
    networkId: number;
    blockchain: Blockchain;
    token: Token;
    label?: string;
    amount?: BigNumber;
    shouldShowIncompleteErrs: boolean;
    shouldCheckBalance: boolean;
    shouldCheckAllowance: boolean;
    onChange: ValidatedBigNumberCallback;
    onVisitBalancesPageClick?: () => void;
    lastForceTokenStateRefetch: number;
}

interface TokenAmountInputState {
    balance: BigNumber;
    allowance: BigNumber;
    isBalanceAndAllowanceLoaded: boolean;
}

export class TokenAmountInput extends React.Component<TokenAmountInputProps, TokenAmountInputState> {
    private _isUnmounted: boolean;
    constructor(props: TokenAmountInputProps) {
        super(props);
        this._isUnmounted = false;
        const defaultAmount = new BigNumber(0);
        this.state = {
            balance: defaultAmount,
            allowance: defaultAmount,
            isBalanceAndAllowanceLoaded: false,
        };
    }
    public componentWillMount() {
        // tslint:disable-next-line:no-floating-promises
        this._fetchBalanceAndAllowanceAsync(this.props.token.address, this.props.userAddress);
    }
    public componentWillUnmount() {
        this._isUnmounted = true;
    }
    public componentWillReceiveProps(nextProps: TokenAmountInputProps) {
        if (
            nextProps.userAddress !== this.props.userAddress ||
            nextProps.networkId !== this.props.networkId ||
            nextProps.token.address !== this.props.token.address ||
            nextProps.lastForceTokenStateRefetch !== this.props.lastForceTokenStateRefetch
        ) {
            // tslint:disable-next-line:no-floating-promises
            this._fetchBalanceAndAllowanceAsync(nextProps.token.address, nextProps.userAddress);
        }
    }
    public render() {
        const amount = this.props.amount
            ? ZeroEx.toUnitAmount(this.props.amount, this.props.token.decimals)
            : undefined;
        const hasLabel = !_.isUndefined(this.props.label);
        return (
            <div className="flex overflow-hidden" style={{ height: hasLabel ? 84 : 62 }}>
                <BalanceBoundedInput
                    label={this.props.label}
                    amount={amount}
                    balance={ZeroEx.toUnitAmount(this.state.balance, this.props.token.decimals)}
                    onChange={this._onChange.bind(this)}
                    validate={this._validate.bind(this)}
                    shouldCheckBalance={this.props.shouldCheckBalance}
                    shouldShowIncompleteErrs={this.props.shouldShowIncompleteErrs}
                    onVisitBalancesPageClick={this.props.onVisitBalancesPageClick}
                    isDisabled={!this.state.isBalanceAndAllowanceLoaded}
                />
                <div style={{ paddingTop: hasLabel ? 39 : 14 }}>{this.props.token.symbol}</div>
            </div>
        );
    }
    private _onChange(isValid: boolean, amount?: BigNumber) {
        let baseUnitAmount;
        if (!_.isUndefined(amount)) {
            baseUnitAmount = ZeroEx.toBaseUnitAmount(amount, this.props.token.decimals);
        }
        this.props.onChange(isValid, baseUnitAmount);
    }
    private _validate(amount: BigNumber): InputErrMsg {
        if (this.props.shouldCheckAllowance && amount.gt(this.state.allowance)) {
            return (
                <span>
                    Insufficient allowance.{' '}
                    <Link
                        to={`${WebsitePaths.Portal}/balances`}
                        style={{ cursor: 'pointer', color: colors.darkestGrey }}
                    >
                        Set allowance
                    </Link>
                </span>
            );
        } else {
            return undefined;
        }
    }
    private async _fetchBalanceAndAllowanceAsync(tokenAddress: string, userAddress: string) {
        this.setState({
            isBalanceAndAllowanceLoaded: false,
        });
        const userAddressIfExists = _.isEmpty(userAddress) ? undefined : userAddress;
        const [balance, allowance] = await this.props.blockchain.getTokenBalanceAndAllowanceAsync(
            userAddressIfExists,
            tokenAddress,
        );
        if (!this._isUnmounted) {
            this.setState({
                balance,
                allowance,
                isBalanceAndAllowanceLoaded: true,
            });
        }
    }
}
