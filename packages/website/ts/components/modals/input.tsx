import * as React from 'react';
import styled from 'styled-components';

export enum InputWidth {
    Half,
    Full,
}

interface InputProps {
    name: string;
    width?: InputWidth;
    label: string;
    type?: string;
    errors?: ErrorProps;
    isErrors?: boolean;
    required?: boolean;
}

interface OptionSelectorProps {
    name: string;
    width?: InputWidth;
    label: string;
    errors?: ErrorProps;
    isErrors?: boolean;
    required?: boolean;
    children: React.ReactNode;
    isFlex?: boolean;
}

interface OptionsWrapperProps {
    isFlex?: boolean;
}

interface CheckBoxProps {
    name: string;
    label: string;
}

interface ErrorProps {
    [key: string]: string;
}

export const OptionSelector = (props: OptionSelectorProps) => {
    const id = `input-${name}`;
    return (
        <InputWrapper {...props}>
            <Label htmlFor={id}>{props.label}</Label>
            <OptionsWrapper isFlex={props.isFlex} id={id}>
                {props.children}
            </OptionsWrapper>
        </InputWrapper>
    );
};

export const CheckBox = React.forwardRef((props: CheckBoxProps, ref?: React.Ref<HTMLInputElement>) => {
    const { name, label } = props;
    const id = `input-${name}`;
    return (
        <CheckBoxWrapper>
            <StyledCheckBox id={id} type={'checkbox'} ref={ref} />
            <CheckBoxLabel htmlFor={id}>{label}</CheckBoxLabel>
        </CheckBoxWrapper>
    );
});

export const Input = React.forwardRef((props: InputProps, ref?: React.Ref<HTMLInputElement>) => {
    const { name, label, type, errors } = props;
    const id = `input-${name}`;
    const componentType = type === 'textarea' ? 'textarea' : 'input';
    const isErrors = errors.hasOwnProperty(name) && errors[name] !== null;
    const errorMessage = isErrors ? errors[name] : null;

    return (
        <InputWrapper {...props}>
            <Label htmlFor={id}>{label}</Label>
            <StyledInput as={componentType} ref={ref} id={id} isErrors={isErrors} {...props} />
            {isErrors && <Error>{errorMessage}</Error>}
        </InputWrapper>
    );
});

Input.defaultProps = {
    width: InputWidth.Full,
    errors: {},
};

const StyledCheckBox = styled.input`
    visibility: hidden;
    &:checked + label:after {
        background-color: #000;
        border: 2px solid #000;
    }
`;

const CheckBoxLabel = styled.label`
    position: relative;
    color: #000;
    opacity: 0.75;
    font-size: 1rem;
    font-weight: 300;
    line-height: 1.2em;
    margin-bottom: 10px;
    display: inline-block;
    padding-left: 1.5rem;
    &:after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        margin: auto;
        height: 1rem;
        width: 1rem;
        border-radius: 50%;
        border: 2px solid #d5d5d5;
    }
`;

const CheckBoxWrapper = styled.div`
`;

const StyledInput = styled.input`
    appearance: none;
    background-color: #fff;
    border: 1px solid #d5d5d5;
    color: #000;
    font-size: 1.294117647rem;
    padding: 16px 15px 14px;
    outline: none;
    width: 100%;
    min-height: ${props => props.type === 'textarea' && `120px`};

    background-color: ${(props: InputProps) => props.isErrors && `#FDEDED`};
    border-color: ${(props: InputProps) => props.isErrors && `#FD0000`};

    &::placeholder {
        color: #c3c3c3;
    }
`;

const InputWrapper = styled.div<InputProps>`
    position: relative;
    flex-grow: ${props => props.width === InputWidth.Full && 1};
    width: ${props => props.width === InputWidth.Half && `calc(50% - 15px)`};

    @media (max-width: 768px) {
        width: 100%;
        margin-bottom: 30px;
    }
`;

const OptionsWrapper = styled.div<OptionsWrapperProps>`
    display: ${props => props.isFlex && 'flex'};
    ${props => {
        if (props.isFlex) {
            return `
                & > * {
                    padding: 0 0.5rem;
                }
                & >:first-child {
                    padding-left: 0;
                }
                & >:last-child {
                    padding-right: 0;
                }
            `;
        }
        return '';
    }}
`;

const Label = styled.label`
    color: #000;
    font-size: 1.111111111rem;
    line-height: 1.4em;
    margin-bottom: 10px;
    display: inline-block;
`;

const Error = styled.span`
    color: #fd0000;
    font-size: 0.833333333rem;
    line-height: 1em;
    display: inline-block;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    transform: translateY(24px);
`;
