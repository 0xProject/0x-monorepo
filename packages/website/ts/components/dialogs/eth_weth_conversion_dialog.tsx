import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RadioButtonGroup from 'material-ui/RadioButton/RadioButtonGroup';
import RadioButton from 'material-ui/RadioButton';
import {Side, Token, TokenState} from 'ts/types';
import {TokenAmountInput} from 'ts/components/inputs/token_amount_input';
import {EthAmountInput} from 'ts/components/inputs/eth_amount_input';
import BigNumber from 'bignumber.js';

interface EthWethConversionDialogProps {
    onComplete: (direction: Side, value: BigNumber) => void;
    onCancelled: () => void;
    isOpen: boolean;
    token: Token;
    tokenState: TokenState;
    etherBalance: BigNumber;
}

interface EthWethConversionDialogState {
    value?: BigNumber;
    direction: Side;
    shouldShowIncompleteErrs: boolean;
    hasErrors: boolean;
}

export class EthWethConversionDialog extends
    React.Component<EthWethConversionDialogProps, EthWethConversionDialogState> {
    constructor() {
        super();
        this.state = {
            direction: Side.deposit,
            shouldShowIncompleteErrs: false,
            hasErrors: true,
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
        return (
            <Dialog
                title="I want to convert"
                titleStyle={{fontWeight: 100}}
                actions={convertDialogActions}
                open={this.props.isOpen}
            >
                {this.renderConversionDialogBody()}
            </Dialog>
        );
    }
    private renderConversionDialogBody() {
        return (
            <div className="mx-auto" style={{maxWidth: 300}}>
                <RadioButtonGroup
                    className="pb1"
                    defaultSelected={this.state.direction}
                    name="conversionDirection"
                    onChange={this.onConversionDirectionChange.bind(this)}
                >
                    <RadioButton
                        className="pb1"
                        value={Side.deposit}
                        label="Ether -> Ether Tokens"
                    />
                    <RadioButton
                        value={Side.receive}
                        label="Ether Tokens -> Ether"
                    />
                </RadioButtonGroup>
                {this.state.direction === Side.receive ?
                    <TokenAmountInput
                        label="Amount to convert"
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
                        label="Amount to convert"
                        balance={this.props.etherBalance}
                        amount={this.state.value}
                        onChange={this.onValueChange.bind(this)}
                        shouldCheckBalance={true}
                        shouldShowIncompleteErrs={this.state.shouldShowIncompleteErrs}
                        onVisitBalancesPageClick={this.props.onCancelled}
                    />
                }
            </div>
        );
    }
    private onConversionDirectionChange(e: any, direction: Side) {
        this.setState({
            value: undefined,
            shouldShowIncompleteErrs: false,
            direction,
            hasErrors: true,
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
            this.props.onComplete(this.state.direction, value);
        }
    }
    private onCancel() {
        this.setState({
            value: undefined,
        });
        this.props.onCancelled();
    }
}
