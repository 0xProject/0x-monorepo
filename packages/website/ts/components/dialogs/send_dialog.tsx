import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import * as React from 'react';
import { Blockchain } from 'ts/blockchain';
import { AddressInput } from 'ts/components/inputs/address_input';
import { TokenAmountInput } from 'ts/components/inputs/token_amount_input';
import { EthAmountInput } from 'ts/containers/inputs/eth_amount_input';
import { Token } from 'ts/types';

interface SendDialogProps {
    blockchain: Blockchain;
    userAddress: string;
    networkId: number;
    onComplete: (recipient: string, value: BigNumber) => void;
    onCancelled: () => void;
    isOpen: boolean;
    asset: Token | 'ETH';
    lastForceTokenStateRefetch: number;
}

interface SendDialogState {
    value?: BigNumber;
    recipient: string;
    shouldShowIncompleteErrs: boolean;
    isAmountValid: boolean;
}

export class SendDialog extends React.Component<SendDialogProps, SendDialogState> {
    constructor(props: SendDialogProps) {
        super(props);
        this.state = {
            recipient: '',
            shouldShowIncompleteErrs: false,
            isAmountValid: false,
        };
    }
    public render(): React.ReactNode {
        const transferDialogActions = [
            <FlatButton key="cancelTransfer" label="Cancel" onClick={this._onCancel.bind(this)} />,
            <FlatButton
                key="sendTransfer"
                disabled={this._hasErrors()}
                label="Send"
                primary={true}
                onClick={this._onSendClick.bind(this)}
            />,
        ];
        return (
            <Dialog
                title="I want to send"
                titleStyle={{ fontWeight: 100 }}
                actions={transferDialogActions}
                open={this.props.isOpen}
            >
                {this._renderSendDialogBody()}
            </Dialog>
        );
    }
    private _renderSendDialogBody(): React.ReactNode {
        const input =
            this.props.asset === 'ETH' ? (
                <EthAmountInput
                    label="Amount to send"
                    shouldShowIncompleteErrs={this.state.shouldShowIncompleteErrs}
                    shouldCheckBalance={true}
                    shouldShowErrs={true}
                    onChange={this._onValueChange.bind(this)}
                    amount={this.state.value}
                />
            ) : (
                <TokenAmountInput
                    blockchain={this.props.blockchain}
                    userAddress={this.props.userAddress}
                    networkId={this.props.networkId}
                    label="Amount to send"
                    token={this.props.asset}
                    shouldShowIncompleteErrs={this.state.shouldShowIncompleteErrs}
                    shouldCheckBalance={true}
                    shouldCheckAllowance={false}
                    onChange={this._onValueChange.bind(this)}
                    amount={this.state.value}
                    lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                />
            );
        return (
            <div className="mx-auto" style={{ maxWidth: 300 }}>
                <div style={{ height: 80 }}>
                    <AddressInput
                        initialAddress={this.state.recipient}
                        updateAddress={this._onRecipientChange.bind(this)}
                        isRequired={true}
                        label="Recipient address'"
                        hintText="Address"
                    />
                </div>
                {input}
            </div>
        );
    }
    private _onRecipientChange(recipient?: string): void {
        this.setState({
            shouldShowIncompleteErrs: false,
            recipient,
        });
    }
    private _onValueChange(isValid: boolean, amount?: BigNumber): void {
        this.setState({
            isAmountValid: isValid,
            value: amount,
        });
    }
    private _onSendClick(): void {
        if (this._hasErrors()) {
            this.setState({
                shouldShowIncompleteErrs: true,
            });
        } else {
            const value = this.state.value;
            this.setState({
                recipient: undefined,
                value: undefined,
            });
            this.props.onComplete(this.state.recipient, value);
        }
    }
    private _onCancel(): void {
        this.setState({
            value: undefined,
        });
        this.props.onCancelled();
    }
    private _hasErrors(): boolean {
        return _.isUndefined(this.state.recipient) || _.isUndefined(this.state.value) || !this.state.isAmountValid;
    }
}
