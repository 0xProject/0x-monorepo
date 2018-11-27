import { darken, saturate } from 'polished';
import * as React from 'react';

import { ColorOption, styled } from '../../style/theme';
import { util } from '../../util/util';

export type ButtonOnClickHandler = (event: React.MouseEvent<HTMLElement>) => void;

export interface ButtonProps {
    backgroundColor?: ColorOption;
    borderColor?: ColorOption;
    fontColor?: ColorOption;
    fontSize?: string;
    width?: string;
    padding?: string;
    type?: string;
    isDisabled?: boolean;
    href?: string;
    onClick?: ButtonOnClickHandler;
    className?: string;
}

const PlainButton: React.StatelessComponent<ButtonProps> = ({
    children,
    isDisabled,
    onClick,
    href,
    type,
    className,
}) => {
    const computedOnClick = isDisabled ? undefined : href ? util.createOpenUrlInNewWindow(href) : onClick;
    return (
        <button type={type} className={className} onClick={computedOnClick} disabled={isDisabled}>
            {children}
        </button>
    );
};

const darkenOnHoverAmount = 0.1;
const darkenOnActiveAmount = 0.2;
const saturateOnFocusAmount = 0.2;
export const Button = styled(PlainButton)`
    && {
        all: initial;
        box-sizing: border-box;
        font-size: ${props => props.fontSize};
        font-family: 'Inter UI', sans-serif;
        font-weight: 500;
        color: ${props => props.fontColor && props.theme[props.fontColor]};
        cursor: ${props => (props.isDisabled ? 'default' : 'pointer')};
        transition: background-color, opacity 0.5s ease;
        padding: ${props => props.padding};
        border-radius: 3px;
        text-align: center;
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
            background-color: ${props =>
                saturate(saturateOnFocusAmount, props.theme[props.backgroundColor || 'white'])};
        }
    }
`;

Button.defaultProps = {
    backgroundColor: ColorOption.primaryColor,
    width: 'auto',
    isDisabled: false,
    padding: '.82em 1.2em',
    fontSize: '16px',
};

Button.displayName = 'Button';
