import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

export interface ButtonInterface {
    text: string;
    transparent?: any;
}

const StyledButton = styled.button<ButtonInterface>`
    appearance: none;
    border: 0;
    background-color: ${colors.brandLight};
    color: ${colors.white};
    text-align: center;
    padding: 13px 22px 14px;

    ${props => props.transparent && `
        border: 1px solid #6A6A6A;
    `}
`;

const Text = styled.span`
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.375rem;
`;

export const Button: React.StatelessComponent<ButtonInterface> = ({ text, transparent }) => (
    <StyledButton transparent>
        <Text>{text}</Text>
    </StyledButton>
);

Button.defaultProps = {
    transparent: false,
};
