import { darken, saturate } from 'polished';
import * as React from 'react';

import { ColorOption, styled } from '../../style/theme';

export enum ButtonHoverStyle {
    Darken = 0,
    Opacity,
}

export interface ButtonProps {
    backgroundColor?: ColorOption;
    borderColor?: ColorOption;
    width?: string;
    padding?: string;
    type?: string;
    isDisabled?: boolean;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    className?: string;
    hoverStyle?: ButtonHoverStyle;
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
    opacity: ${props => (props.hoverStyle === ButtonHoverStyle.Opacity ? 0.7 : 1)};
    &:hover {
        background-color: ${props =>
            shouldDarken(props)
                ? darken(darkenOnHoverAmount, props.theme[props.backgroundColor || 'white'])
                : ''} !important;
        opacity: 1;
    }
    &:active {
        background-color: ${props =>
            shouldDarken(props) ? darken(darkenOnActiveAmount, props.theme[props.backgroundColor || 'white']) : ''};
        opacity: 1;
    }
    &:disabled {
        opacity: ${props => (props.hoverStyle === ButtonHoverStyle.Darken ? 0.5 : 0.2)};
    }
    &:focus {
        background-color: ${props => saturate(saturateOnFocusAmount, props.theme[props.backgroundColor || 'white'])};
    }
`;

const shouldDarken = (props: ButtonProps) => {
    return !props.isDisabled && props.hoverStyle === ButtonHoverStyle.Darken;
};

Button.defaultProps = {
    backgroundColor: ColorOption.primaryColor,
    borderColor: ColorOption.primaryColor,
    width: 'auto',
    isDisabled: false,
    padding: '1em 2.2em',
    hoverStyle: ButtonHoverStyle.Darken,
};

Button.displayName = 'Button';
