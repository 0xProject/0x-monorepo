import * as React from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface ButtonInterface {
    color?: string;
    children?: Node | string;
    isTransparent?: boolean;
    isNoBorder?: boolean;
    isNoPadding?: boolean;
    isWithArrow?: boolean;
    isAccentColor?: boolean;
    hasIcon?: boolean | string;
    isInline?: boolean;
    href?: string;
    onClick?: () => any;
    theme?: {
        textColor: string;
    };
}

export const Button = styled.button<ButtonInterface>`
    appearance: none;
    border: 1px solid transparent;
    display: ${props => props.isInline && 'inline-block'};
    background-color: ${props => !props.isTransparent ? colors.brandLight : 'transparent'};
    border-color: ${props => (props.isTransparent && !props.isNoBorder && !props.isWithArrow) && '#6a6a6a'};
    color: ${props => props.isAccentColor ? props.theme.linkColor : (props.color || props.theme.textColor)};
    padding: ${props => (!props.isNoPadding && !props.isWithArrow) && '18px 30px'};
    text-align: center;
    font-size: ${props => props.isWithArrow ? '20px' : '18px'};
    text-decoration: none;

    svg {
        margin-left: 12px;
    }

    path {
        fill: ${props => props.isAccentColor ? props.theme.linkColor : (props.color || props.theme.textColor)};
    }
`;

export const Link = (props: ButtonInterface) => {
    const {
        children,
        href,
        isWithArrow,
    } = props;
    const Component = Button.withComponent(ReactRouterLink);

    return (
        <Component to={href} {...props}>
            {children}

            { isWithArrow &&
                <svg width="16" height="15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M4.484.246l.024 1.411 8.146.053L.817 13.547l.996.996L13.65 2.706l.052 8.146 1.412.024L15.045.315 4.484.246z"
                    />
                </svg>
            }
        </Component>
    );
};

// Added this, & + & doesnt really work since we switch with element types...
export const ButtonWrap = styled.div`
    button + button,
    a + a,
    a + button,
    button + a {
        margin-left: 10px;
    }
`;
