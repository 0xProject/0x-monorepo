import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface Props {
}

interface InputProps {
    isSubmitted: boolean;
    name: string;
    label: string;
    type: string;
}

interface ArrowProps {
    isSubmitted: boolean;
}

const Input: React.ReactNode = React.forwardRef((props: InputProps, ref) => {
    const { name, label, type } = props;
    const id = `input-${name}`;

    return (
        <InnerInputWrapper {...props}>
            <label className="visuallyHidden" htmlFor={id}>{label}</label>
            <StyledInput ref={ref} id={id} placeholder={label} {...props} />
        </InnerInputWrapper>
    );
};

export class NewsletterForm extends React.Component {
    public emailInput = React.createRef();
    public state = {
        isSubmitted: false,
    };
    public render(): React.ReactNode {
        const {isSubmitted} = this.state;

        return (
            <StyledForm onSubmit={this._onSubmit.bind(this)}>
                <InputWrapper>
                    <Input isSubmitted={isSubmitted} name="email" type="email" label="Email Address" ref={this.emailInput} required />

                    <SubmitButton>
                        <Arrow isSubmitted={isSubmitted} width="22" height="17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.066 0l-1.068 1.147 6.232 6.557H0v1.592h18.23l-6.232 6.557L13.066 17l8.08-8.5-8.08-8.5z" fill="#CBCBCB"/>
                        </Arrow>
                    </SubmitButton>
                    <SuccessText isSubmitted={isSubmitted}>🎉 Thank you for signing up!</SuccessText>
                </InputWrapper>
                <Text>Subscribe to our newsletter for updates in the 0x ecosystem</Text>
            </StyledForm>
        );
    }

    private async _onSubmit(e) {
        e.preventDefault();

        const email = this.emailInput.current.value;

        this.setState({ isSubmitted: true });

        try {
            const response = await fetch('/email', {
                method: 'post',
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({ email }),
            });
            const json = await response.json();

            console.log(response.json());
        } catch (e) {
            console.log(e);
        }
    }
}

const StyledForm = styled.form`
    appearance: none;
    border: 0;
    color: ${colors.white};
    padding: 13px 0 14px;
    margin-top: 27px;
`;

const StyledInput = styled.input`
    appearance: none;
    background-color: transparent;
    border: 0;
    border-bottom: 1px solid #393939;
    color: #B1B1B1; // #9D9D9D on light theme
    font-size: 1.294117647rem;
    padding: 15px 0;
    outline: none;
    width: 100%;
`;

const InputWrapper = styled.div`
    position: relative;
`;

const InnerInputWrapper = styled.div<ArrowProps>`
    opacity: ${props => props.isSubmitted && 0};
    visibility: ${props => props.isSubmitted && 'hidden'};
    transition: opacity 0.25s ease-in-out, visibility 0.25s ease-in-out;
    transition-delay: 0.30s;
`;

const SubmitButton = styled.button`
    width: 44px;
    height: 44px;
    background-color: transparent;
    border: 0;
    position: absolute;
    right: 0;
    top: calc(50% - 22px);
    overflow: hidden;
    outline: 0;

    &:focus-within {
        background-color: #eee;
    }
`;

const Text = styled.p`
    color: #656565;
    font-size: 0.833333333rem;
    font-weight: 300;
    line-height: 1.2em;
    margin-top: 15px;
`;

const SuccessText = styled.p<ArrowProps>`
    color: #B1B1B1;
    font-size: 1rem;
    font-weight: 300;
    line-height: 1.2em;
    padding-top: 25px;
    position: absolute;
    left: 0;
    top: 0;
    text-align: center;
    right: 50px;
    opacity: ${props => props.isSubmitted ? 1 : 0};
    visibility: ${props => props.isSubmitted ? 'visible' : 'hidden'};
    transition: opacity 0.25s ease-in-out, visibility 0.25s ease-in-out;
    transition-delay: 0.55s;
`;

const Arrow = styled.svg<ArrowProps>`
    transform: ${props => props.isSubmitted && `translateX(44px)`};
    transition: transform 0.25s ease-in-out;
`;
