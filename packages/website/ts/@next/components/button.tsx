import * as React from 'react';
import { Link as ReactRouterLink, NavLink as ReactRouterNavLink } from 'react-router-dom';
import styled from 'styled-components';

import { BREAKPOINTS } from 'ts/@next/components/layout';
import { colors } from 'ts/style/colors';

interface ButtonInterface {
    bgColor?: string;
    color?: string;
    children?: Node | string;
    isTransparent?: boolean;
    isNoBorder?: boolean;
    isCentered?: boolean;
    isNoPadding?: boolean;
    isWithArrow?: boolean;
    isAccentColor?: boolean;
    hasIcon?: boolean | string;
    isInline?: boolean;
    type?: string;
    href?: string;
    onClick?: () => any;
    theme?: {
        textColor: string;
    };
}

export const Button = styled.button<ButtonInterface>`
    appearance: none;
    border: ${props => !props.isNoBorder && `1px solid transparent`};
    display: inline-block;
    background-color: ${props => (!props.isTransparent || props.bgColor) ? (props.bgColor || colors.brandLight) : 'transparent'};
    border-color: ${props => (props.isTransparent && !props.isWithArrow) && '#6a6a6a'};
    color: ${props => props.isAccentColor ? props.theme.linkColor : (props.color || props.theme.textColor)};
    padding: ${props => (!props.isNoPadding && !props.isWithArrow) && '18px 30px'};
    text-align: center;
    font-size: ${props => props.isWithArrow ? '20px' : '18px'};
    text-decoration: none;
    cursor: pointer;
    transition: background-color 0.35s, border-color 0.35s;

    svg {
        margin-left: 9px;
        transition: transform 0.5s;
        transform: translate3d(-2px, 2px, 0);
    }

    path {
        fill: ${props => props.isAccentColor ? props.theme.linkColor : (props.color || props.theme.textColor)};
    }

    &:hover {
        background-color: ${props => !props.isTransparent && '#04BEA8'};
        border-color: ${props => (props.isTransparent && !props.isNoBorder && !props.isWithArrow) && '#00AE99'};

        svg {
            transform: translate3d(2px, -2px, 0);
        }
    }
`;

export const Link: React.ReactNode = (props: ButtonInterface) => {
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

Link.defaultProps = {
    isTransparent: true,
};

export const NavLink: React.ReactNode = (props: ButtonInterface) => {
    const {
        children,
        href,
        isWithArrow,
    } = props;
    const Component = Button.withComponent(ReactRouterNavLink);

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

NavLink.defaultProps = {
    isTransparent: true,
};

// Added this, & + & doesnt really work since we switch with element types...
export const ButtonWrap = styled.div`
    button + button,
    a + a,
    a + button,
    button + a {
        @media (min-width: ${BREAKPOINTS.mobile}) {
            margin-left: 10px;
        }

        @media (max-width: ${BREAKPOINTS.mobile}) {
            margin: 0 10px;
        }
    }

    @media (max-width: ${BREAKPOINTS.mobile}) {
        white-space: nowrap;
    }
`;
