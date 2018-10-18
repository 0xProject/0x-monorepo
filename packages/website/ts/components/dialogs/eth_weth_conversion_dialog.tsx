import { colors } from '@0x/react-shared';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import * as React from 'react';
import { Blockchain } from 'ts/blockchain';
import { TokenAmountInput } from 'ts/components/inputs/token_amount_input';
import { EthAmountInput } from 'ts/containers/inputs/eth_amount_input';
import { Side, Token } from 'ts/types';

interface EthWethConversionDialogProps {
    blockchain: Blockchain;
    userAddress: string;
    networkId: number;
    direction: Side;
    onComplete: (direction: Side, value: BigNumber) => void;
    onCancelled: () => void;
    isOpen: boolean;
    token: Token;
    etherBalanceInWei?: BigNumber;
    lastForceTokenStateRefetch: number;
}

interface EthWethConversionDialogState {
    value?: BigNumber;
    shouldShowIncompleteErrs: boolean;
    hasErrors: boolean;
    isEthTokenBalanceLoaded: boolean;
    ethTokenBalance: BigNumber;
}

export class EthWethConversionDialog extends React.Component<
    EthWethConversionDialogProps,
    EthWethConversionDialogState
> {
    private _isUnmounted: boolean;
    constructor(props: EthWethConversionDialogProps) {
        super(props);
        this._isUnmounted = false;
        this.state = {
            shouldShowIncompleteErrs: false,
            hasErrors: false,
            isEthTokenBalanceLoaded: false,
            ethTokenBalance: new BigNumber(0),
        };
    }
    public componentWillMount(): void {
        // tslint:disable-next-line:no-floating-promises
        this._fetchEthTokenBalanceAsync();
    }
    public componentWillUnmount(): void {
        this._isUnmounted = true;
    }
    public render(): React.ReactNode {
        const convertDialogActions = [
            <FlatButton key="cancel" label="Cancel" onClick={this._onCancel.bind(this)} />,
            <FlatButton key="convert" label="Convert" primary={true} onClick={this._onConvertClick.bind(this)} />,
        ];
        const title = this.props.direction === Side.Deposit ? 'Wrap ETH' : 'Unwrap WETH';
        return !_.isUndefined(this.props.etherBalanceInWei) ? (
            <Dialog
                title={title}
                titleStyle={{ fontWeight: 100 }}
                actions={convertDialogActions}
                contentStyle={{ width: 448 }}
                open={this.props.isOpen}
            >
                {this._renderConversionDialogBody()}
            </Dialog>
        ) : null;
    }
    private _renderConversionDialogBody(): React.ReactNode {
        const explanation =
            this.props.direction === Side.Deposit
                ? 'Convert your Ether into a tokenized, tradable form.'
                : "Convert your Wrapped Ether back into it's native form.";
        const isWrappedVersion = this.props.direction === Side.Receive;
        return (
            <div>
                <div className="pb2">{explanation}</div>
                <div className="mx-auto" style={{ maxWidth: 312 }}>
                    <div className="flex">
                        {this._renderCurrency(isWrappedVersion)}
                        <div style={{ paddingTop: 68 }}>
                            <i style={{ fontSize: 28, color: colors.darkBlue }} className="zmdi zmdi-arrow-right" />
                        </div>
                        {this._renderCurrency(!isWrappedVersion)}
                    </div>
                    <div className="pt2 mx-auto" style={{ width: 245 }}>
                        {this.props.direction === Side.Receive ? (
                            <TokenAmountInput
                                lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                                blockchain={this.props.blockchain}
                                userAddress={this.props.userAddress}
                                networkId={this.props.networkId}
                                token={this.props.token}
                                shouldShowIncompleteErrs={this.state.shouldShowIncompleteErrs}
                                shouldCheckBalance={true}
                                shouldCheckAllowance={false}
                                onChange={this._onValueChange.bind(this)}
                                amount={this.state.value}
                            />
                        ) : (
                            <EthAmountInput
                                amount={this.state.value}
                                onChange={this._onValueChange.bind(this)}
                                shouldCheckBalance={true}
                                shouldShowIncompleteErrs={this.state.shouldShowIncompleteErrs}
                            />
                        )}
                        <div className="pt1" style={{ fontSize: 12 }}>
                            <div className="left">1 ETH = 1 WETH</div>
                            {this.props.direction === Side.Receive &&
                                this.state.isEthTokenBalanceLoaded && (
                                    <div
                                        className="right"
                                        onClick={this._onMaxClick.bind(this)}
                                        style={{
                                            color: colors.darkBlue,
                                            textDecoration: 'underline',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Max
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    private _renderCurrency(isWrappedVersion: boolean): React.ReactNode {
        const name = isWrappedVersion ? 'Wrapped Ether' : 'Ether';
        const iconUrl = isWrappedVersion ? '/images/token_icons/ether_erc20.png' : '/images/ether.png';
        const symbol = isWrappedVersion ? 'WETH' : 'ETH';
        return (
            <div className="mx-auto pt2">
                <div className="center" style={{ color: colors.darkBlue }}>
                    {name}
                </div>
                <div className="center py2">
                    <img src={iconUrl} style={{ width: 60 }} />
                </div>
                <div className="center" style={{ fontSize: 12 }}>
                    ({symbol})
                </div>
            </div>
        );
    }
    private _onMaxClick(): void {
        this.setState({
            value: this.state.ethTokenBalance,
        });
    }
    private _onValueChange(isValid: boolean, amount?: BigNumber): void {
        this.setState({
            value: amount,
            hasErrors: !isValid,
        });
    }
    private _onConvertClick(): void {
        if (this.state.hasErrors) {
            this.setState({
                shouldShowIncompleteErrs: true,
            });
        } else {
            const value = this.state.value;
            this.setState({
                value: undefined,
            });
            this.props.onComplete(this.props.direction, value);
        }
    }
    private _onCancel(): void {
        this.setState({
            value: undefined,
        });
        this.props.onCancelled();
    }
    private async _fetchEthTokenBalanceAsync(): Promise<void> {
        const userAddressIfExists = _.isEmpty(this.props.userAddress) ? undefined : this.props.userAddress;
        const [balance] = await this.props.blockchain.getTokenBalanceAndAllowanceAsync(
            userAddressIfExists,
            this.props.token.address,
        );
        if (!this._isUnmounted) {
            this.setState({
                isEthTokenBalanceLoaded: true,
                ethTokenBalance: balance,
            });
        }
    }
}
