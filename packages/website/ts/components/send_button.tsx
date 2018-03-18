import { BigNumber, logUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';
import { Blockchain } from 'ts/blockchain';
import { SendDialog } from 'ts/components/dialogs/send_dialog';
import { Dispatcher } from 'ts/redux/dispatcher';
import { BlockchainCallErrs, Token } from 'ts/types';
import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';

interface SendButtonProps {
    userAddress: string;
    networkId: number;
    token: Token;
    dispatcher: Dispatcher;
    blockchain: Blockchain;
    onError: () => void;
    lastForceTokenStateRefetch: number;
    refetchTokenStateAsync: (tokenAddress: string) => Promise<void>;
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
        const labelStyle = this.state.isSending ? { fontSize: 10 } : {};
        return (
            <div>
                <RaisedButton
                    style={{ width: '100%' }}
                    labelStyle={labelStyle}
                    disabled={this.state.isSending}
                    label={this.state.isSending ? 'Sending...' : 'Send'}
                    onClick={this._toggleSendDialog.bind(this)}
                />
                <SendDialog
                    blockchain={this.props.blockchain}
                    userAddress={this.props.userAddress}
                    networkId={this.props.networkId}
                    isOpen={this.state.isSendDialogVisible}
                    onComplete={this._onSendAmountSelectedAsync.bind(this)}
                    onCancelled={this._toggleSendDialog.bind(this)}
                    token={this.props.token}
                    lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                />
            </div>
        );
    }
    private _toggleSendDialog() {
        this.setState({
            isSendDialogVisible: !this.state.isSendDialogVisible,
        });
    }
    private async _onSendAmountSelectedAsync(recipient: string, value: BigNumber) {
        this.setState({
            isSending: true,
        });
        this._toggleSendDialog();
        const token = this.props.token;
        try {
            await this.props.blockchain.transferAsync(token, recipient, value);
            await this.props.refetchTokenStateAsync(token.address);
        } catch (err) {
            const errMsg = `${err}`;
            if (_.includes(errMsg, BlockchainCallErrs.UserHasNoAssociatedAddresses)) {
                this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
                return;
            } else if (!utils.didUserDenyWeb3Request(errMsg)) {
                logUtils.log(`Unexpected error encountered: ${err}`);
                logUtils.log(err.stack);
                this.props.onError();
                await errorReporter.reportAsync(err);
            }
        }
        this.setState({
            isSending: false,
        });
    }
}
