import { darken, saturate } from 'polished';
import * as React from 'react';

import { ColorOption, styled } from '../../style/theme';

export interface ButtonProps {
    backgroundColor?: ColorOption;
    borderColor?: ColorOption;
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
    transition: background-color, opacity 0.5s ease;
    padding: ${props => props.padding};
    border-radius: 3px;
    outline: none;
    width: ${props => props.width};
    background-color: ${props => (props.backgroundColor ? props.theme[props.backgroundColor] : 'none')};
    border: ${props => (props.borderColor ? `1px solid ${props.theme[props.borderColor]}` : 'none')};
    &:hover {
        background-color: ${props =>
            !props.isDisabled
                ? darken(darkenOnHoverAmount, props.theme[props.backgroundColor || 'white'])
                : ''} !important;
    }
    &:active {
        background-color: ${props =>
            !props.isDisabled ? darken(darkenOnActiveAmount, props.theme[props.backgroundColor || 'white']) : ''};
    }
    &:disabled {
        opacity: 0.5;
    }
    &:focus {
        background-color: ${props => saturate(saturateOnFocusAmount, props.theme[props.backgroundColor || 'white'])};
    }
`;

Button.defaultProps = {
    backgroundColor: ColorOption.primaryColor,
    width: 'auto',
    isDisabled: false,
    padding: '1em 2.2em',
};

Button.displayName = 'Button';
