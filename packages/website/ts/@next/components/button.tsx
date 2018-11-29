import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

export interface Props extends ButtonInterface {
    text: string;
    transparent?: boolean;
    inline?: boolean;
}

const StyledButton = styled.button<Props>`
    appearance: none;
    border: 0;
    background-color: ${colors.brandLight};
    color: ${colors.white};
    text-align: center;
    padding: 13px 22px 14px;

    ${props => props.transparent && `
        background-color: transparent;
        border: 1px solid #6A6A6A;
    `}

    ${props => props.inline && `
        display: inline-block;
        & + & {
            margin-left: 10px;
        }
    `}
`;

const Text = styled.span`
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.375rem;
`;

export const Button: React.StatelessComponent<Props> = ({ ...props }) => (
    <StyledButton {...props}>
        <Text>{props.text}</Text>
    </StyledButton>
);

export const ButtonTransparent: React.StatelessComponent<Props> = ({ ...props }) => (
    <StyledButton transparent={true} {...props}>
        <Text>{props.text}</Text>
    </StyledButton>
);

Button.defaultProps = {
    transparent: false,
};
