import { darken, saturate } from 'polished';
import * as React from 'react';
import styled from 'styled-components';

/**
 * AN EXAMPLE OF HOW TO CREATE A STYLED COMPONENT USING STYLED-COMPONENTS
 * SEE: https://www.styled-components.com/docs/basics#coming-from-css
 */
export interface ButtonProps {
    backgroundColor?: string;
    borderColor?: string;
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
    background-color: ${props => (props.backgroundColor ? props.backgroundColor : 'none')};
    border: ${props => (props.borderColor ? `1px solid ${props.backgroundColor}` : 'none')};
    &:hover {
        background-color: ${props =>
            !props.isDisabled ? darken(darkenOnHoverAmount, props.backgroundColor) : ''} !important;
    }
    &:active {
        background-color: ${props => (!props.isDisabled ? darken(darkenOnActiveAmount, props.backgroundColor) : '')};
    }
    &:disabled {
        opacity: 0.5;
    }
    &:focus {
        background-color: ${props => saturate(saturateOnFocusAmount, props.backgroundColor)};
    }
`;

Button.defaultProps = {
    backgroundColor: 'red',
    width: 'auto',
    isDisabled: false,
    padding: '1em 2.2em',
};
Button.displayName = 'Button';
