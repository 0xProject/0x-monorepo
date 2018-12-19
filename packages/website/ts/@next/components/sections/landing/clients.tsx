import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';
import { Heading } from 'ts/@next/components/text';

import { Section, WrapGrid } from 'ts/@next/components/newLayout';

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
        imageUrl: 'images/@next/clients/radar-relay.svg',
        persistOnMobile: true,
    },
    {
        name: 'Paradex',
        imageUrl: 'images/@next/clients/paradex.svg',
        persistOnMobile: true,
    },
    {
        name: 'Star Bit Ex',
        imageUrl: 'images/@next/clients/starbitex.svg',
    },
    {
        name: 'LedgerDex',
        imageUrl: 'images/@next/clients/ledgerdex.svg',
    },
    {
        name: 'OpenRelay',
        imageUrl: 'images/@next/clients/openrelay.svg',
        persistOnMobile: true,
    },
    {
        name: 'Bamboo Relay',
        imageUrl: 'images/@next/clients/bamboo.svg',
        persistOnMobile: true,
    },
    {
        name: 'Shark Relay',
        imageUrl: 'images/@next/clients/sharkrelay.svg',
        persistOnMobile: true,
    },
    {
        name: 'dEX',
        imageUrl: 'images/@next/clients/ercdex.svg',
        persistOnMobile: true,
    },
];

export const SectionLandingClients = () => (
    <Section isTextCentered={true}>
        <Heading size="small">Join the growing number of projects developing on 0x</Heading>

        <WrapGrid isWrapped={true}>
            {_.map(projects, (item: ProjectLogo, index) => (
                <StyledProject key={`client-${index}`} isOnMobile={item.persistOnMobile}>
                    <img src={item.imageUrl} alt={item.name} />
                </StyledProject>
            ))}
        </WrapGrid>
    </Section>
);

const StyledProject =
    styled.div <
    StyledProjectInterface >
    `
    flex-shrink: 0;

    img {
        object-fit: contain;
        width: 100%;
        height: 100%;
    }

    @media (min-width: 768px) {
        width:  auto;
        height: 50px;
        margin: 30px;
    }

    @media (max-width: 768px) {
        width: auto;
        height: 42px;
        margin: 15px;
        display: ${props => !props.isOnMobile && 'none'};
    }
`;
