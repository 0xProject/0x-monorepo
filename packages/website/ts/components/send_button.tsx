import { BigNumber, logUtils } from '@0x/utils';
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
    asset: Token | 'ETH';
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
    public render(): React.ReactNode {
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
                    asset={this.props.asset}
                    lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                />
            </div>
        );
    }
    private _toggleSendDialog(): void {
        this.setState({
            isSendDialogVisible: !this.state.isSendDialogVisible,
        });
    }
    private async _onSendAmountSelectedAsync(recipient: string, value: BigNumber): Promise<void> {
        this.setState({
            isSending: true,
        });
        this._toggleSendDialog();
        try {
            if (this.props.asset === 'ETH') {
                await this.props.blockchain.sendAsync(recipient, value);
            } else {
                const token = this.props.asset;
                await this.props.blockchain.transferAsync(token, recipient, value);
                await this.props.refetchTokenStateAsync(token.address);
            }
        } catch (err) {
            const errMsg = `${err}`;
            if (_.includes(errMsg, BlockchainCallErrs.UserHasNoAssociatedAddresses)) {
                this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
                return;
            } else if (!utils.didUserDenyWeb3Request(errMsg)) {
                logUtils.log(`Unexpected error encountered: ${err}`);
                logUtils.log(err.stack);
                this.props.onError();
                errorReporter.report(err);
            }
        }
        this.setState({
            isSending: false,
        });
    }
}
