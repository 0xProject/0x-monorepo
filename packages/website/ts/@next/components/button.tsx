import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface ButtonInterface {
    children: Node | string;
    transparent?: any;
    hasIcon?: any;
    inline?: any;
    href?: string;
    onClick?: () => void;
}

export const Button: React.StatelessComponent<ButtonInterface> = props => {
    const { onClick } = props;
    const Component = onClick ? StyledButton : StyledButton.withComponent('a');
    return <Component {...props}>{props.children}</Component>;
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

const StyledButton = styled.button<ButtonInterface>`
    appearance: none;
    border: 1px solid transparent;
    display: ${props => props.inline && 'inline-block'};
    background-color: ${props => !props.transparent && colors.brandLight};
    border-color: ${props => props.transparent && '#6a6a6a'};
    color: ${props => props.color || props.theme.textColor};
    text-align: center;
    padding: 14px 22px;
    text-decoration: none;
`;
