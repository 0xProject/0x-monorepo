import * as React from 'react';
import styled from 'styled-components';
import { Icon } from 'ts/components/icon';

interface InputProps {
    className?: string;
    name?: string;
    width?: string;
    type?: string;
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    onChange?: (e: React.ChangeEvent) => void;
}

export const Input = React.forwardRef((props: InputProps, ref?: React.Ref<HTMLInputElement>) => {
    const { name, type, placeholder, defaultValue, onChange, width, className, value } = props;
    const componentType = type === 'textarea' ? 'textarea' : 'input';
    const inputProps = { name, type };

    return (
        <InputWrapper className={className} width={width}>
            <Icon size={18} name="search" />
            <StyledInput
                as={componentType}
                ref={ref}
                value={value}
                id={`input-${name}`}
                placeholder={placeholder}
                defaultValue={defaultValue}
                onChange={onChange}
                {...inputProps}
            />
        </InputWrapper>
    );
});

const StyledInput = styled.input`
    appearance: none;
    border: none;
    color: #000;
    font-size: 22px;
    padding: 10px 12px 9px;
    outline: none;
    width: 100%;
    min-height: ${props => props.type === 'textarea' && `120px`};

    &::placeholder {
        color: #c3c3c3;
    }
`;

const InputWrapper = styled.div<InputProps>`
    display: flex;
    align-items: center;
    position: relative;
    width: ${props => props.width || '100%'};
    border-bottom: 1px solid #d5d5d5;
`;
