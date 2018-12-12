import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';
import {Heading, Paragraph} from 'ts/@next/components/text';

import {Section, WrapGrid} from 'ts/@next/components/newLayout';

interface ProjectLogo {
    name: string;
    imageUrl?: string;
    persistOnMobile?: boolean;
}

interface StyledProjectInterface {
    isOnMobile?: boolean;
}

const projects: ProjectLogo[] = [
    {
        name: 'Radar Relay',
        imageUrl: '/images/@next/relayer-logos/logo_1.png',
        persistOnMobile: true,
    },
    {
        name: 'Paradex',
        imageUrl: '/images/@next/relayer-logos/logo_5.png',
        persistOnMobile: true,
    },
    {
        name: 'Amadeus',
        imageUrl: '/images/@next/relayer-logos/logo_3.png',
        persistOnMobile: true,
    },
    {
        name: 'The Ocean X',
        imageUrl: '/images/@next/relayer-logos/logo_4.png',
    },
    {
        name: 'Paradex',
        imageUrl: '/images/@next/relayer-logos/logo_5.png',
    },
    {
        name: 'Decent EX',
        imageUrl: '/images/@next/relayer-logos/logo_2.1.png',
    },
    {
        name: 'dEX',
        imageUrl: '/images/@next/relayer-logos/logo_2.2.png',
    },
    {
        name: 'OpenRelay',
        imageUrl: '/images/@next/relayer-logos/logo_2.3.png',
        persistOnMobile: true,
    },
    {
        name: 'DDEX',
        imageUrl: '/images/@next/relayer-logos/logo_2.png',
        persistOnMobile: true,
    },
];

export const SectionLandingClients = () => (
    <Section isTextCentered={true}>
        <Heading size="small">
            Join the growing number of projects developing on 0x
        </Heading>

        <WrapGrid isWrapped={true}>
            {_.map(projects, (item: ProjectLogo, index) => (
                <StyledProject
                    key={`client-${index}`}
                    isOnMobile={item.persistOnMobile}
                >
                    <img src={item.imageUrl} alt={item.name} />
                </StyledProject>
            ))}
        </WrapGrid>
    </Section>
);

const StyledProject = styled.div<StyledProjectInterface>`
    flex-shrink: 0;

    img {
        object-fit: contain;
        width: 100%;
        height: 100%;
    }

    @media (min-width: 768px) {
        width: 120px;
        height: 120px;
        margin: 30px;
    }

    @media (max-width: 768px) {
        width: 100px;
        height: 100px;
        margin: 15px;
        display: ${props => !props.isOnMobile && 'none'};
    }
`;
