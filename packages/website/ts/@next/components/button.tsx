import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';


interface ButtonInterface {
    children: Node | string;
    transparent?: any;
    inline?: any;
    href?: string,
    onClick?: () => void;
}

export const Button: React.StatelessComponent<ButtonInterface> = props => {
    const { onClick } = props;
    const Component = onClick ? StyledButton : StyledButton.withComponent('a');
    return <Component {...props}>{ props.children }</Component>;
};

const StyledButton = styled.button<ButtonInterface>`
    appearance: none;
    border: 0;
    display: ${props => props.inline && 'inline-block'};
    background-color: ${props => !props.transparent && colors.brandLight};
    border: ${props => props.transparent && '1px solid #6a6a6a'};
    color: ${colors.white};
    text-align: center;
    padding: 13px 22px 14px;
`;
