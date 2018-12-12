import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

export enum InputWidth {
    Half,
    Full,
}

interface InputProps {
    name: string;
    width: InputWidth;
    label: string;
    type?: string;
}

interface LabelProps {
    string: boolean;
}

export const Input = React.forwardRef((props: InputProps, ref) => {
    const { name, label, type } = props;
    const id = `input-${name}`;

    return (
        <InputWrapper {...props}>
            <Label htmlFor={id}>{label}</Label>
            <StyledInput ref={ref} id={id} placeholder={label} {...props} />
        </InputWrapper>
    );
});

Input.defaultProps = {
    width: InputWidth.Full,
};

const StyledInput = styled.input`
    appearance: none;
    background-color: #fff;
    border: 1px solid #D5D5D5;
    color: #000;
    font-size: 1.294117647rem;
    padding: 16px 15px;
    outline: none;
    width: 100%;

    &::placeholder {
        color: #9D9D9D;
    }
`;

const InputWrapper = styled.div<InputProps>`
    position: relative;
    flex-grow: ${props => props.width === InputWidth.Full && 1};
    width: ${props => props.width === InputWidth.Half && `calc(50% - 15px)`};
`;

const Label = styled.label`
    color: #000;
    font-size: 1.111111111rem;
    line-height: 1.4em;
    margin-bottom: 10px;
    display: inline-block;
`;
