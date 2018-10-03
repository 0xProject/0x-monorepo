import { darken, saturate } from 'polished';
import * as React from 'react';

import { ColorOption, styled } from '../../style/theme';

export interface ButtonProps {
    fontColor: ColorOption;
    backgroundColor: ColorOption;
    borderColor?: ColorOption;
    fontSize?: string;
    fontFamily?: string;
    width?: string;
    padding?: string;
    type?: string;
    isDisabled?: boolean;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    className?: string;
}

const PlainButton: React.StatelessComponent<ButtonProps> = ({ children, isDisabled, onClick, type, className }) => (
    <button type={type} className={className} onClick={isDisabled ? undefined : onClick} disabled={isDisabled}>
        {children}
    </button>
);

const darkenOnHoverAmount = 0.1;
const darkenOnActiveAmount = 0.2;
const saturateOnFocusAmount = 0.2;
export const Button = styled(PlainButton)`
    cursor: ${props => (props.isDisabled ? 'default' : 'pointer')};
    font-size: ${props => props.fontSize};
    color: ${props => props.fontColor};
    transition: background-color, opacity 0.5s ease;
    padding: ${props => props.padding};
    border-radius: 6px;
    font-weight: 500;
    outline: none;
    font-family: ${props => props.fontFamily};
    width: ${props => props.width};
    background-color: ${props => props.backgroundColor};
    border: ${props => (props.borderColor ? `1px solid ${props.theme[props.borderColor]}` : 'none')};
    &:hover {
        background-color: ${props =>
            !props.isDisabled ? darken(darkenOnHoverAmount, props.theme[props.backgroundColor]) : ''} !important;
    }
    &:active {
        background-color: ${props =>
            !props.isDisabled ? darken(darkenOnActiveAmount, props.theme[props.backgroundColor]) : ''};
    }
    &:disabled {
        opacity: 0.5;
    }
    &:focus {
        background-color: ${props => saturate(saturateOnFocusAmount, props.theme[props.backgroundColor])};
    }
`;

Button.defaultProps = {
    fontSize: '12px',
    fontColor: ColorOption.white,
    backgroundColor: ColorOption.primaryColor,
    width: 'auto',
    fontFamily: 'Inter UI',
    isDisabled: false,
    padding: '0.8em 2.2em',
};

Button.displayName = 'Button';
