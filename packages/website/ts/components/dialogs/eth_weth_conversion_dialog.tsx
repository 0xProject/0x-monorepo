import BigNumber from 'bignumber.js';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import * as React from 'react';
import {EthAmountInput} from 'ts/components/inputs/eth_amount_input';
import {TokenAmountInput} from 'ts/components/inputs/token_amount_input';
import {Side, Token, TokenState} from 'ts/types';
import {colors} from 'ts/utils/colors';

interface EthWethConversionDialogProps {
    direction: Side;
    onComplete: (direction: Side, value: BigNumber) => void;
    onCancelled: () => void;
    isOpen: boolean;
    token: Token;
    tokenState: TokenState;
    etherBalance: BigNumber;
}

interface EthWethConversionDialogState {
    value?: BigNumber;
    shouldShowIncompleteErrs: boolean;
    hasErrors: boolean;
}

export class EthWethConversionDialog extends
    React.Component<EthWethConversionDialogProps, EthWethConversionDialogState> {
    constructor() {
        super();
        this.state = {
            shouldShowIncompleteErrs: false,
            hasErrors: false,
        };
    }
    public render() {
        const convertDialogActions = [
            <FlatButton
                key="cancel"
                label="Cancel"
                onTouchTap={this.onCancel.bind(this)}
            />,
            <FlatButton
                key="convert"
                label="Convert"
                primary={true}
                onTouchTap={this.onConvertClick.bind(this)}
            />,
        ];
        const title = this.props.direction === Side.Deposit ?  'Wrap ETH' : 'Unwrap WETH';
        return (
            <Dialog
                title={title}
                titleStyle={{fontWeight: 100}}
                actions={convertDialogActions}
                contentStyle={{width: 448}}
                open={this.props.isOpen}
            >
                {this.renderConversionDialogBody()}
            </Dialog>
        );
    }
    private renderConversionDialogBody() {
        const explanation = this.props.direction === Side.Deposit ?
                            'Convert your Ether into a tokenized, tradable form.' :
                            'Convert your Wrapped Ether back into it\'s native form.';
        const isWrappedVersion = this.props.direction === Side.Receive;
        return (
            <div>
                <div className="pb2">
                    {explanation}
                </div>
                <div className="mx-auto" style={{maxWidth: 312}}>
                    <div className="flex">
                        {this.renderCurrency(isWrappedVersion)}
                        <div style={{paddingTop: 68}}>
                            <i
                                style={{fontSize: 28, color: colors.darkBlue}}
                                className="zmdi zmdi-arrow-right"
                            />
                        </div>
                        {this.renderCurrency(!isWrappedVersion)}
                    </div>
                    <div
                        className="pt2 mx-auto"
                        style={{width: 245}}
                    >
                        {this.props.direction === Side.Receive ?
                            <TokenAmountInput
                                token={this.props.token}
                                tokenState={this.props.tokenState}
                                shouldShowIncompleteErrs={this.state.shouldShowIncompleteErrs}
                                shouldCheckBalance={true}
                                shouldCheckAllowance={false}
                                onChange={this.onValueChange.bind(this)}
                                amount={this.state.value}
                                onVisitBalancesPageClick={this.props.onCancelled}
                            /> :
                            <EthAmountInput
                                balance={this.props.etherBalance}
                                amount={this.state.value}
                                onChange={this.onValueChange.bind(this)}
                                shouldCheckBalance={true}
                                shouldShowIncompleteErrs={this.state.shouldShowIncompleteErrs}
                                onVisitBalancesPageClick={this.props.onCancelled}
                            />
                        }
                        <div
                            className="pt1"
                            style={{fontSize: 12}}
                        >
                            <div className="left">1 ETH = 1 WETH</div>
                            {this.props.direction === Side.Receive &&
                                <div
                                    className="right"
                                    onClick={this.onMaxClick.bind(this)}
                                    style={{color: colors.darkBlue, textDecoration: 'underline', cursor: 'pointer'}}
                                >
                                    Max
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    private renderCurrency(isWrappedVersion: boolean) {
        const name = isWrappedVersion ? 'Wrapped Ether' : 'Ether';
        const iconUrl = isWrappedVersion ? '/images/token_icons/ether_erc20.png' : '/images/ether.png';
        const symbol = isWrappedVersion ? 'WETH' : 'ETH';
        return (
            <div className="mx-auto pt2">
                <div
                    className="center"
                    style={{color: colors.darkBlue}}
                >
                    {name}
                </div>
                <div className="center py2">
                    <img src={iconUrl} style={{width: 60}} />
                </div>
                <div className="center" style={{fontSize: 12}}>
                    ({symbol})
                </div>
            </div>
        );
    }
    private onMaxClick() {
        this.setState({
            value: this.props.tokenState.balance,
        });
    }
    private onValueChange(isValid: boolean, amount?: BigNumber) {
        this.setState({
            value: amount,
            hasErrors: !isValid,
        });
    }
    private onConvertClick() {
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
    private onCancel() {
        this.setState({
            value: undefined,
        });
        this.props.onCancelled();
    }
}
