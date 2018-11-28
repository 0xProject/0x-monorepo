import * as React from 'react';
import styled from 'styled-components';

export interface ButtonInterface {
    text: string;
}

const StyledButton = styled.button`
    text-align: center;
`;

const Text = styled.span`
    font-size: 1rem;
    line-height: 1.375rem;
`;

export const Button: React.StatelessComponent<ButtonInterface> = ({ text }) => (
    <StyledButton>
        <Text>Get Started</Text>
    </StyledButton>
);
