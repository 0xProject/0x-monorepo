import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { DialogContent, DialogOverlay } from '@reach/dialog';
import '@reach/dialog/styles.css';

import {Button} from 'ts/@next/components/button';
import { Icon } from 'ts/@next/components/icon';
import {Input, InputWidth} from 'ts/@next/components/modals/input';
import {Heading, Paragraph} from 'ts/@next/components/text';
import {GlobalStyle} from 'ts/@next/constants/globalStyle';

interface Props {
    theme?: GlobalStyle;
    isOpen?: boolean;
    onDismiss?: () => void;
}

interface FormProps {
    isSuccessful?: boolean;
    isSubmitting?: boolean;
}

interface ErrorResponseProps {
    param: string;
    location: string;
    msg: string;
}

interface ErrorResponse {
    errors: ErrorResponseProps[];
}

interface ErrorProps {
    [key: string]: string;
}

export class ModalContact extends React.Component<Props> {
    public state = {
        isSubmitting: false,
        isSuccessful: false,
        errors: {},
    };
    public nameRef: React.RefObject<HTMLInputElement> = React.createRef();
    public emailRef: React.RefObject<HTMLInputElement> = React.createRef();
    public companyProjectRef: React.RefObject<HTMLInputElement> = React.createRef();
    public linkRef: React.RefObject<HTMLInputElement> = React.createRef();
    public commentsRef: React.RefObject<HTMLInputElement> = React.createRef();
    public constructor(props: Props) {
        super(props);
    }
    public render(): React.ReactNode {
        const {isOpen, onDismiss} = this.props;
        const {isSuccessful, errors} = this.state;

        return (
            <>
                <DialogOverlay
                    style={{ background: 'rgba(0, 0, 0, 0.75)', zIndex: 30 }}
                    isOpen={isOpen}
                    onDismiss={onDismiss}
                >
                    <StyledDialogContent>
                        <Form onSubmit={this._onSubmitAsync.bind(this)} isSuccessful={isSuccessful}>
                            <Heading color={colors.textDarkPrimary} size={34} asElement="h2">Contact the 0x Core Team</Heading>
                            <Paragraph isMuted={true} color={colors.textDarkPrimary}>If you're considering building on 0x, we're happy to answer your questions. Fill out the form so we can connect you with the right person to help you get started.</Paragraph>
                            <InputRow>
                                <Input
                                    name="name"
                                    label="Your name"
                                    type="text"
                                    width={InputWidth.Half}
                                    ref={this.nameRef}
                                    required={true}
                                    errors={errors}
                                />
                                <Input
                                    name="email"
                                    label="Your email"
                                    type="email"
                                    ref={this.emailRef}
                                    required={true}
                                    errors={errors}
                                    width={InputWidth.Half}
                                />
                            </InputRow>
                            <InputRow>
                                <Input
                                    name="companyOrProject"
                                    label="Name of your project / company"
                                    type="text"
                                    ref={this.companyProjectRef}
                                    required={true}
                                    errors={errors}
                                />
                            </InputRow>
                            <InputRow>
                                <Input
                                    name="link"
                                    label="Do you have any documentation or a website?"
                                    type="text"
                                    ref={this.linkRef}
                                    errors={errors}
                                />
                            </InputRow>
                            <InputRow>
                                <Input
                                    name="comments"
                                    label="Anything else?"
                                    type="textarea"
                                    ref={this.commentsRef}
                                    errors={errors}
                                />
                            </InputRow>
                            <ButtonRow>
                                <Button
                                    color="#5C5C5C"
                                    isNoBorder={true}
                                    isTransparent={true}
                                    type="button"
                                    onClick={this.props.onDismiss}
                                >
                                    Back
                                </Button>
                                <Button>Submit</Button>
                            </ButtonRow>
                        </Form>
                        <Confirmation isSuccessful={isSuccessful}>
                            <Icon name="rocketship" size="large" margin={[0, 0, 'default', 0]}  />
                            <Heading color={colors.textDarkPrimary} size={34} asElement="h2">Thanks for contacting us.</Heading>
                            <Paragraph isMuted={true} color={colors.textDarkPrimary}>We'll get back to you soon. If you need quick support in the meantime, reach out to the 0x team on Discord.</Paragraph>
                            <Button onClick={this.props.onDismiss}>Done</Button>
                        </Confirmation>
                    </StyledDialogContent>
                </DialogOverlay>
            </>
        );
    }
    private async _onSubmitAsync(e: Event): Promise<void> {
        e.preventDefault();

        const name = this.nameRef.current.value;
        const email = this.emailRef.current.value;
        const projectOrCompany = this.companyProjectRef.current.value;
        const link = this.linkRef.current.value;
        const comments = this.commentsRef.current.value;

        this.setState({ ...this.state, errors: [], isSubmitting: true });

        try {
            const response = await fetch('https://website-api.0x.org/leads', {
                method: 'post',
                mode: 'cors',
                credentials: 'same-origin',
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify(_.omitBy({ name, email, projectOrCompany, link, comments }, _.isEmpty)),
            });

            if (!response.ok) {
                const errorResponse: ErrorResponse = await response.json();
                const errors = this._parseErrors(errorResponse.errors);
                this.setState({ ...this.state, isSubmitting: false, errors });

                throw new Error('Request failed');
            }

            this.setState({ ...this.state, isSuccessful: true });
        } catch (e) {
            // Empty block
        }
    }
    private _parseErrors(errors: ErrorResponseProps[]): ErrorProps  {
        return _
            .reduce(errors, (hash: ErrorProps, error: ErrorResponseProps) => {
                const { param, msg } = error;
                const key = param;
                hash[key] = msg;

                return hash;
            }, {});
    }
}
// Handle errors: {"errors":[{"location":"body","param":"name","msg":"Invalid value"},{"location":"body","param":"email","msg":"Invalid value"}]}

const InputRow = styled.div`
    width: 100%;
    flex: 0 0 auto;

    @media (min-width: 768px) {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
    }
`;

const ButtonRow = styled(InputRow)`
    @media (max-width: 768px) {
        display: flex;
        flex-direction: column;

        button:nth-child(1) {
            order: 2;
        }

        button:nth-child(2) {
            order: 1;
            margin-bottom: 10px;
        }
    }
`;

const StyledDialogContent = styled(DialogContent)`
    position: relative;
    max-width: 800px;
    background-color: #F6F6F6 !important;
    padding: 60px 60px !important;

    @media (max-width: 768px) {
        width: calc(100vw - 40px) !important;
        margin: 40px auto !important;
        padding: 30px 30px !important;
    }
`;

const Form = styled.form<FormProps>`
    position: relative;
    transition: opacity 0.30s ease-in-out, visibility 0.30s ease-in-out;

    opacity: ${props => props.isSuccessful && `0`};
    visibility: ${props => props.isSuccessful && `hidden`};
`;

const Confirmation = styled.div<FormProps>`
    position: absolute;
    top: 50%;
    text-align: center;
    width: 100%;
    left: 0;
    transition: opacity 0.30s ease-in-out, visibility 0.30s ease-in-out;
    transition-delay: 0.40s;
    padding: 60px 60px;
    transform: translateY(-50%);
    opacity: ${props => props.isSuccessful ? `1` : `0`};
    visibility: ${props => props.isSuccessful ? 'visible' : `hidden`};

    p {
        max-width: 492px;
        margin-left: auto;
        margin-right: auto;
    }
`;
