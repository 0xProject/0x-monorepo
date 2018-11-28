import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

export interface Props {
    size?: string;
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

export const Heading: React.StatelessComponent<Props> = ({ children }) => (
    <StyledHeading>{children}</StyledHeading>
);

export const Intro: React.StatelessComponent<Props> = ({ children }) => (
    <StyledIntro>{children}</StyledIntro>
);
