import * as React from 'react';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface ButtonInterface {
    children: Node | string;
    isTransparent?: boolean;
    hasIcon?: boolean | string;
    isInline?: boolean;
    href?: string;
    history?: {
        push: () => void;
    };
    onClick?: () => void;
}

export const Button = styled.button<ButtonInterface>`
    appearance: none;
    border: 1px solid transparent;
    display: ${props => props.isInline && 'inline-block'};
    background-color: ${props => !props.isTransparent ? colors.brandLight : 'transparent'};
    border-color: ${props => props.isTransparent && '#6a6a6a'};
    color: ${props => props.color || props.theme.textColor};
    text-align: center;
    padding: 14px 22px;
    font-size: 18px;
    text-decoration: none;
`;

export const Link = withRouter((props: ButtonInterface) => {
    const {
        history,
        href,
        children,
    } = props;
    const Component = StyledButton.withComponent('a');

    return (
        <Component onClick={history.push(href)}>
            {children}
        </Component>
    );
});

// Added this, & + & doesnt really work since we switch with element types...
export const ButtonWrap = styled.div`
    button + button,
    a + a,
    a + button,
    button + a {
        margin-left: 10px;
    }
`;
