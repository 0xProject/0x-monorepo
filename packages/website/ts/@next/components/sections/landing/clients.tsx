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
        imageUrl: 'images/@next/clients/client-radar.png',
        persistOnMobile: true,
    },
    {
        name: 'Paradex',
        imageUrl: 'images/@next/clients/client-paradex.png',
        persistOnMobile: true,
    },
    {
        name: 'The Ocean X',
        imageUrl: 'images/@next/clients/client-oceanx.png',
    },
    {
        name: 'Decent EX',
        imageUrl: 'images/@next/clients/client-decent.png',
    },
    {
        name: 'dEX',
        imageUrl: 'images/@next/clients/client-dex.png',
    },
    {
        name: 'OpenRelay',
        imageUrl: 'images/@next/clients/client-openrelay.png',
        persistOnMobile: true,
    },
    {
        name: 'Amadeus',
        imageUrl: 'images/@next/clients/client-amadeus.png',
        persistOnMobile: true,
    },
    {
        name: 'DDEX',
        imageUrl: 'images/@next/clients/client-ddex.png',
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
