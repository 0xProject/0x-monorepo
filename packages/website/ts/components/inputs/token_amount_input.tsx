import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import * as React from 'react';
import { Blockchain } from 'ts/blockchain';
import { Link } from 'ts/components/documentation/shared/link';
import { BalanceBoundedInput } from 'ts/components/inputs/balance_bounded_input';
import { colors } from 'ts/style/colors';
import { Token, ValidatedBigNumberCallback, WebsitePaths } from 'ts/types';

interface TokenAmountInputProps {
    userAddress: string;
    networkId: number;
    blockchain: Blockchain;
    token: Token;
    label?: string;
    amount?: BigNumber;
    hintText?: string;
    shouldShowIncompleteErrs: boolean;
    shouldCheckBalance: boolean;
    shouldCheckAllowance: boolean;
    onChange: ValidatedBigNumberCallback;
    onErrorMsgChange?: (errorMsg: React.ReactNode) => void;
    lastForceTokenStateRefetch: number;
    shouldShowErrs?: boolean;
    shouldShowUnderline?: boolean;
    style?: React.CSSProperties;
    labelStyle?: React.CSSProperties;
    inputHintStyle?: React.CSSProperties;
}

interface TokenAmountInputState {
    balance: BigNumber;
    allowance: BigNumber;
    isBalanceAndAllowanceLoaded: boolean;
}

const HEIGHT_WITH_LABEL = 84;
const HEIGHT_WITHOUT_LABEL = 62;

export class TokenAmountInput extends React.Component<TokenAmountInputProps, TokenAmountInputState> {
    public static defaultProps: Partial<TokenAmountInputProps> = {
        shouldShowErrs: true,
        shouldShowUnderline: true,
    };
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
    public componentDidMount(): void {
        // tslint:disable-next-line:no-floating-promises
        this._fetchBalanceAndAllowanceAsync(this.props.token.address, this.props.userAddress);
    }
    public componentWillUnmount(): void {
        this._isUnmounted = true;
    }
    public componentWillReceiveProps(nextProps: TokenAmountInputProps): void {
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
    public render(): React.ReactNode {
        const amount = this.props.amount
            ? Web3Wrapper.toUnitAmount(this.props.amount, this.props.token.decimals)
            : undefined;
        return (
            <div className="flex overflow-hidden" style={this._getStyle()}>
                <BalanceBoundedInput
                    label={this.props.label}
                    amount={amount}
                    balance={Web3Wrapper.toUnitAmount(this.state.balance, this.props.token.decimals)}
                    onChange={this._onChange.bind(this)}
                    onErrorMsgChange={this.props.onErrorMsgChange}
                    validate={this._validate.bind(this)}
                    shouldCheckBalance={this.props.shouldCheckBalance}
                    shouldShowIncompleteErrs={this.props.shouldShowIncompleteErrs}
                    isDisabled={!this.state.isBalanceAndAllowanceLoaded}
                    hintText={this.props.hintText}
                    shouldShowErrs={this.props.shouldShowErrs}
                    shouldShowUnderline={this.props.shouldShowUnderline}
                    inputStyle={this.props.style}
                    inputHintStyle={this.props.inputHintStyle}
                />
                <div style={this._getLabelStyle()}>{this.props.token.symbol}</div>
            </div>
        );
    }
    private _onChange(isValid: boolean, amount?: BigNumber): void {
        let baseUnitAmount;
        if (amount !== undefined) {
            baseUnitAmount = Web3Wrapper.toBaseUnitAmount(amount, this.props.token.decimals);
        }
        this.props.onChange(isValid, baseUnitAmount);
    }
    private _validate(amount: BigNumber): React.ReactNode {
        if (this.props.shouldCheckAllowance && amount.gt(this.state.allowance)) {
            return (
                <span>
                    Insufficient allowance.{' '}
                    <Link
                        to={`${WebsitePaths.Portal}/account`}
                        textDecoration="underline"
                        fontColor={colors.darkestGrey}
                    >
                        Set allowance
                    </Link>
                </span>
            );
        } else {
            return undefined;
        }
    }
    private async _fetchBalanceAndAllowanceAsync(tokenAddress: string, userAddress: string): Promise<void> {
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
    private _getStyle(): React.CSSProperties {
        const hasLabel = this.props.label !== undefined;
        return this.props.style !== undefined
            ? this.props.style
            : { height: hasLabel ? HEIGHT_WITH_LABEL : HEIGHT_WITHOUT_LABEL };
    }
    private _getLabelStyle(): React.CSSProperties {
        const hasLabel = this.props.label !== undefined;
        return this.props.labelStyle || { paddingTop: hasLabel ? 39 : 14 };
    }
}
