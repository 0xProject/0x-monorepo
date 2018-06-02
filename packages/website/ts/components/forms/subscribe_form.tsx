import { colors } from '@0xproject/react-shared';
import * as React from 'react';

import { logUtils } from '@0xproject/utils';
import { Button } from 'ts/components/ui/button';
import { Container } from 'ts/components/ui/container';
import { Input } from 'ts/components/ui/input';
import { Text } from 'ts/components/ui/text';
import { styled } from 'ts/style/theme';
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
    lastSubmittedEmail: string;
    status: SubscribeFormStatus;
}

export class SubscribeForm extends React.Component<SubscribeFormProps, SubscribeFormState> {
    public state = {
        emailText: '',
        lastSubmittedEmail: '',
        status: SubscribeFormStatus.None,
    };
    public render(): React.ReactNode {
        const formFontSize = '15px';
        return (
            <Container className="flex flex-column items-center justify-between md-mx2 sm-mx2">
                <Container marginBottom="15px">
                    <Text fontFamily="Roboto Mono" fontColor={colors.grey} center={true}>
                        Subscribe to our newsletter for 0x relayer and dApp updates
                    </Text>
                </Container>
                <form onSubmit={this._handleFormSubmitAsync.bind(this)}>
                    <Container className="flex flex-wrap justify-center items-center">
                        <Container marginTop="15px">
                            <Input
                                placeholder="you@email.com"
                                value={this.state.emailText}
                                fontColor={colors.white}
                                fontSize={formFontSize}
                                backgroundColor={colors.projectsGrey}
                                width="275px"
                                onChange={this._handleEmailInputChange.bind(this)}
                            />
                        </Container>
                        <Container marginLeft="15px" marginTop="15px">
                            <Button
                                type="submit"
                                backgroundColor={colors.darkButtonGrey}
                                fontColor={colors.white}
                                fontSize={formFontSize}
                            >
                                Subscribe
                            </Button>
                        </Container>
                    </Container>
                </form>
                {this._renderMessage()}
            </Container>
        );
    }
    private _renderMessage(): React.ReactNode {
        let message = null;
        switch (this.state.status) {
            case SubscribeFormStatus.Error:
                message = 'Sorry, something went wrong. Try again later.';
                break;
            case SubscribeFormStatus.Loading:
                message = 'One second...';
                break;
            case SubscribeFormStatus.Success:
                message = `Thanks! ${this.state.lastSubmittedEmail} is now on the mailing list.`;
                break;
            case SubscribeFormStatus.None:
                break;
        }
        return (
            <Container isHidden={!message} marginTop="30px">
                <Text center={true} fontFamily="Roboto Mono" fontColor={colors.grey}>
                    {message || 'spacer text'}
                </Text>
            </Container>
        );
    }

    private _handleEmailInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
        this.setState({ emailText: event.target.value });
    }
    private async _handleFormSubmitAsync(event: React.FormEvent<HTMLInputElement>): Promise<void> {
        event.preventDefault();
        if (!this.state.emailText) {
            return;
        }
        this.setState({
            status: SubscribeFormStatus.Loading,
            lastSubmittedEmail: this.state.emailText,
        });
        try {
            const response = await backendClient.subscribeToNewsletterAsync(this.state.emailText);
            const status = response.status === 200 ? SubscribeFormStatus.Success : SubscribeFormStatus.Error;
            this._setStatus(status);
        } catch (error) {
            logUtils.log(error);
            this._setStatus(SubscribeFormStatus.Error);
        } finally {
            this.setState({ emailText: '' });
        }
    }
    private _setStatus(status: SubscribeFormStatus, then?: () => void): void {
        this.setState({ status }, then);
    }
}
