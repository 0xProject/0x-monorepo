import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import formArrow from 'ts/@next/icons/form-arrow.svg';

import {Button} from 'ts/@next/components/button';
import {Icon} from 'ts/@next/components/icon';

interface InputProps {
    name: string;
    label: string;
}

interface Props {
}

const Input = ({ ...props }) => {
    const { name, label } = props;
    const id = 'input-' + name;

    return (
        <>
            <label className="visuallyHidden" htmlFor={id}>{label}</label>
            <StyledInput id={id} placeholder={label} {...props} />
        </>
    )
};

export const NewsletterForm: React.StatelessComponent = (props: Props) => (
    <StyledForm>
        <InputWrapper>
            <Input name="email" type="email" label="Email Address" />
            <Icon icon={formArrow} />
        </InputWrapper>
        <Text>Subscribe to our newsletter for updates in the 0x ecosystem</Text>
    </StyledForm>
);

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
    padding: 0 0 16px;
    width: 100%;
    margin-bottom: 13px;
`;

const InputWrapper = styled.div`
    position: relative;
`;

const ButtonWrapper = styled(Button)`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const Text = styled.span`
    color: #656565;
    font-size: 0.833333333rem;
    font-weight: 300;
    line-height: 1.2em;
`;
