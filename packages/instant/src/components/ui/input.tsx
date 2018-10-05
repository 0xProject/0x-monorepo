import * as React from 'react';

import { ColorOption, styled } from '../../style/theme';

export interface InputProps {
    className?: string;
    value?: string;
    width?: string;
    fontSize?: string;
    fontColor?: ColorOption;
    placeholder?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const PlainInput: React.StatelessComponent<InputProps> = ({ value, className, placeholder, onChange }) => (
    <input className={className} value={value} onChange={onChange} placeholder={placeholder} />
);

export const Input = styled(PlainInput)`
    font-size: ${props => props.fontSize};
    width: ${props => props.width};
    padding: 0.1em 0em;
    font-family: 'Inter UI';
    color: ${props => props.theme[props.fontColor || 'white']};
    background: transparent;
    outline: none;
    border: none;
    &::placeholder {
        color: ${props => props.theme[props.fontColor || 'white']};
        opacity: 0.5;
    }
`;

Input.defaultProps = {
    width: 'auto',
    fontColor: ColorOption.white,
    fontSize: '12px',
};

Input.displayName = 'Input';
