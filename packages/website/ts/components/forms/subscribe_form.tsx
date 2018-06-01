import { colors } from '@0xproject/react-shared';
import * as React from 'react';

import RaisedButton from 'material-ui/RaisedButton';
import { backendClient } from 'ts/utils/backend_client';

export interface SubscribeFormProps {}

export enum SubscribeFormStatus {
    None,
    Error,
    Success,
    Loading,
}

export interface SubscribeFormState {
    emailText: string;
    status: SubscribeFormStatus;
}

export class SubscribeForm extends React.Component<SubscribeFormProps, SubscribeFormState> {
    public state = {
        emailText: '',
        status: SubscribeFormStatus.None,
    };
    public render(): React.ReactNode {
        return (
            <div>
                Subscribe to our newsletter for 0x relayer and dApp updates
                <div>
                    <input value={this.state.emailText} onChange={this._handleEmailInputChange.bind(this)} />
                    <RaisedButton
                        labelStyle={{
                            textTransform: 'none',
                            fontSize: 15,
                            fontWeight: 400,
                        }}
                        buttonStyle={{
                            borderRadius: 6,
                        }}
                        style={{
                            boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.25)',
                            borderRadius: 6,
                            height: 48,
                            width: 120,
                        }}
                        labelColor="white"
                        backgroundColor="#252525"
                        onClick={this._handleSubscribeClickAsync.bind(this)}
                        label="Subscribe"
                    />
                </div>
            </div>
        );
    }
    private _handleEmailInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
        this.setState({ emailText: event.target.value });
    }
    private async _handleSubscribeClickAsync(): Promise<void> {
        this._setStatus(SubscribeFormStatus.Loading);
        const isSuccess = await backendClient.subscribeToNewsletterAsync(this.state.emailText);
        const status = isSuccess ? SubscribeFormStatus.Success : SubscribeFormStatus.Error;
        this._setStatus(status);
    }
    private _setStatus(status: SubscribeFormStatus): void {
        this.setState({ status });
    }
}
