import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface InputProps {
    name: string;
    label: string;
    type: string;
}

interface Props {
}

const Input = (props: InputProps) => {
    const { name, label, type } = props;
    const id = `input-${name}`;

    return (
        <>
            <label className="visuallyHidden" htmlFor={id}>{label}</label>
            <StyledInput id={id} placeholder={label} {...props} />
        </>
    );
};

export class NewsletterForm extends React.Component {
    public submit = () => {
        // submit this form
    }

    public render(): React.ReactNode {
        return (
            <StyledForm>
                <InputWrapper>
                    <Input name="email" type="email" label="Email Address" />

                    <SubmitButton onClick={this.submit}>
                        <svg width="22" height="17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.066 0l-1.068 1.147 6.232 6.557H0v1.592h18.23l-6.232 6.557L13.066 17l8.08-8.5-8.08-8.5z" fill="#CBCBCB"/>
                        </svg>
                    </SubmitButton>
                </InputWrapper>
                <Text>Subscribe to our newsletter for updates in the 0x ecosystem</Text>
            </StyledForm>
        )
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
    color: ${colors.textDarkSecondary};
    font-size: 1.294117647rem;
    padding: 15px 0;
    outline: none;
    width: 100%;
`;

const InputWrapper = styled.div`
    position: relative;
`;

const SubmitButton = styled.button`
    width: 44px;
    height: 44px;
    background-color: transparent;
    border: 0;
    position: absolute;
    right: 0;
    top: calc(50% - 22px);
`;

const Text = styled.p`
    color: #656565;
    font-size: 0.833333333rem;
    font-weight: 300;
    line-height: 1.2em;
    margin-top: 15px;
`;
