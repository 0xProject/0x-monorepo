import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface Props {
    size?: 'normal' | 'medium' | 'large';
    center?: boolean;
}

const StyledHeading = styled.h1`
    color: ${colors.white};
    font-size: 80px;
    line-height: 1em;
`;

const StyledIntro = styled.p`
    color: ${colors.white};
    opacity: 0.75;
    font-size: 22px;
    line-height: 1.823529412em;
`;

const StyledText = styled.p<Props>`
    color: ${colors.white};
    font-size: 1rem;
    ${(props: Props) => props.size === 'medium' && `
        font-size: 1.555555556rem;
        line-height: 1.357142857em;
    `}
    ${(props: Props) => props.center && `
        text-align: center
    `}
`;

export const Heading: React.StatelessComponent<Props> = ({ children }) => (
    <StyledHeading>{children}</StyledHeading>
);

export const Intro: React.StatelessComponent<Props> = ({ children }) => (
    <StyledIntro>{children}</StyledIntro>
);

export const Text: React.StatelessComponent<Props> = ({ children, ...props }) => (
    <StyledText {...props}>{children}</StyledText>
);

Text.defaultProps = {
    size: 'normal',
    center: false,
};
