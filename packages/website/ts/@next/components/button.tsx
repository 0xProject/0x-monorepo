import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

export interface ButtonInterface {
    text: string;
}

const StyledButton = styled.button`
    appearance: none;
    border: 0;
    background-color: ${colors.brandLight};
    color: ${colors.white};
    text-align: center;
    padding: 13px 22px 14px;
`;

const Text = styled.span`
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.375rem;
`;

export const Button: React.StatelessComponent<ButtonInterface> = ({ text }) => (
    <StyledButton>
        <Text>{text}</Text>
    </StyledButton>
);
