import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';
import {Blockchain} from 'ts/blockchain';
import {SendDialog} from 'ts/components/dialogs/send_dialog';
import {Dispatcher} from 'ts/redux/dispatcher';
import {BlockchainCallErrs, Token, TokenState} from 'ts/types';
import {errorReporter} from 'ts/utils/error_reporter';
import {utils} from 'ts/utils/utils';

interface SendButtonProps {
    token: Token;
    tokenState: TokenState;
    dispatcher: Dispatcher;
    blockchain: Blockchain;
    onError: () => void;
}

interface SendButtonState {
    isSendDialogVisible: boolean;
    isSending: boolean;
}

export class SendButton extends React.Component<SendButtonProps, SendButtonState> {
    public constructor(props: SendButtonProps) {
        super(props);
        this.state = {
            isSendDialogVisible: false,
            isSending: false,
        };
    }
    public render() {
        const labelStyle = this.state.isSending ? {fontSize: 10} : {};
        return (
            <div>
                <RaisedButton
                    style={{width: '100%'}}
                    labelStyle={labelStyle}
                    disabled={this.state.isSending}
                    label={this.state.isSending ? 'Sending...' : 'Send'}
                    onClick={this.toggleSendDialog.bind(this)}
                />
                <SendDialog
                    isOpen={this.state.isSendDialogVisible}
                    onComplete={this.onSendAmountSelectedAsync.bind(this)}
                    onCancelled={this.toggleSendDialog.bind(this)}
                    token={this.props.token}
                    tokenState={this.props.tokenState}
                />
            </div>
        );
    }
    private toggleSendDialog() {
        this.setState({
            isSendDialogVisible: !this.state.isSendDialogVisible,
        });
    }
    private async onSendAmountSelectedAsync(recipient: string, value: BigNumber) {
        this.setState({
            isSending: true,
        });
        this.toggleSendDialog();
        const token = this.props.token;
        const tokenState = this.props.tokenState;
        let balance = tokenState.balance;
        try {
            await this.props.blockchain.transferAsync(token, recipient, value);
            balance = balance.minus(value);
            this.props.dispatcher.replaceTokenBalanceByAddress(token.address, balance);
        } catch (err) {
            const errMsg = `${err}`;
            if (_.includes(errMsg, BlockchainCallErrs.UserHasNoAssociatedAddresses)) {
                this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
                return;
            } else if (!_.includes(errMsg, 'User denied transaction')) {
                utils.consoleLog(`Unexpected error encountered: ${err}`);
                utils.consoleLog(err.stack);
                this.props.onError();
                await errorReporter.reportAsync(err);
            }
        }
        this.setState({
            isSending: false,
        });
    }
}
