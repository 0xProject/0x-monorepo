import { colors } from '@0x/react-shared';
import * as React from 'react';
import { styled } from 'ts/style/theme';

export interface InputProps {
    className?: string;
    value?: string;
    width?: string;
    fontSize?: string;
    fontColor?: string;
    placeholderColor?: string;
    placeholder?: string;
    backgroundColor?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const PlainInput: React.StatelessComponent<InputProps> = ({ value, className, placeholder, onChange }) => (
    <input className={className} value={value} onChange={onChange} placeholder={placeholder} />
);

export const Input = styled(PlainInput)`
    font-size: ${props => props.fontSize};
    width: ${props => props.width};
    padding: 0.8em 1.2em;
    border-radius: 3px;
    font-family: 'Roboto Mono';
    color: ${props => props.fontColor};
    border: none;
    background-color: ${props => props.backgroundColor};
    &::placeholder {
        color: ${props => props.placeholderColor};
    }
`;

Input.defaultProps = {
    width: 'auto',
    backgroundColor: colors.white,
    fontColor: colors.darkestGrey,
    placeholderColor: colors.darkGrey,
    fontSize: '12px',
};

Input.displayName = 'Input';
