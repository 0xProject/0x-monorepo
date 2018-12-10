import * as React from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface LinkInterface {
    color?: string;
    children?: Node | string;
    isNoArrow?: boolean;
    hasIcon?: boolean | string;
    isInline?: boolean;
    href?: string;
    theme?: {
        textColor: string;
    };
}

const StyledLink = styled(ReactRouterLink)<LinkInterface>`
    display: ${props => props.isInline && 'inline-block'};
    color: ${props => props.color || props.theme.linkColor};
    padding: ${props => !props.isNoPadding && '18px 30px'};
    text-align: center;
    font-size: 18px;
    text-decoration: none;

    @media (max-width: 768px) {
        padding: ${props => !props.isNoPadding && '6% 10%'};
    }
`;

export const Link = (props: LinkInterface) => {
    const {
        children,
        href,
    } = props;

    return (
        <StyledLink to={href} {...props}>
            {children}
        </StyledLink>
    );
};

// Added this, & + & doesnt really work since we switch with element types...
export const LinkWrap = styled.div`
    a + a,
    a + button,
    button + a {
        margin-left: 20px;
    }
`;
