import * as React from 'react';
import styled from 'styled-components';

import { GetStartedLinks, IGetStartedLinkProps } from 'ts/components/docs/home/get_started_links';
import { IStepLinkProps, StepLinks } from 'ts/components/docs/shared/step_links';

interface IMiddleSectionProps {
    getStartedLinks: IGetStartedLinkProps[];
    usefulLinks: IStepLinkProps[];
}

export const MiddleSection: React.FC<IMiddleSectionProps> = ({ getStartedLinks, usefulLinks }) => (
    <MiddleSectionWrapper>
        <GetStartedLinks heading="Get started" links={getStartedLinks} />
        <StepLinks heading="Useful Links" links={usefulLinks} />
    </MiddleSectionWrapper>
);

const MiddleSectionWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 70px;
    grid-row-gap: 30px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;
