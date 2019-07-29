import * as React from 'react';
import styled from 'styled-components';

import { Heading } from 'ts/components/text';

import { GetStartedLinks, IGetStartedLinkProps } from 'ts/components/docs/home/get_started_links';
import { IStepLinkProps, StepLinks } from 'ts/components/docs/home/step_links';

interface IMiddleSectionProps {
    getStartedLinks: IGetStartedLinkProps[];
    usefulLinks: IStepLinkProps[];
}

export const MiddleSection: React.FC<IMiddleSectionProps> = ({ getStartedLinks, usefulLinks }) => (
    <MiddleSectionWrapper>
        <div>
            <Heading size="default">Get Started</Heading>
            <GetStartedLinks links={getStartedLinks} />
        </div>
        <div>
            <Heading size="default">Useful Links</Heading>
            <StepLinks links={usefulLinks} />
        </div>
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
