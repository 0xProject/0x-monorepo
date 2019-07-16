import React from 'react';
import styled from 'styled-components';

import { IStepLinkConfig, StepLink } from 'ts/components/docs/step_link';

import { colors } from 'ts/style/colors';

export interface ILinkProps {
    links: IStepLinkConfig[];
}

export const StepLinks: React.FC<ILinkProps> = ({ links }) => (
    <StepLinksWrapper>
        {links.map((link, index) => (
            <StepLink key={`step-${index}`} {...link} />
        ))}
    </StepLinksWrapper>
);

const StepLinksWrapper = styled.div`
    background-color: ${colors.backgroundLight};
    border: 1px solid #dbdfdd;
`;
