import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';
import {Section, Wrap, WrapCentered, WrapGrid} from 'ts/@next/components/layout';
import {Heading, Paragraph} from 'ts/@next/components/text';

interface ProjectLogo {
    name: string;
    imageUrl?: string;
}

const projects: ProjectLogo[] = [
    {
        name: 'Radar Relay',
        imageUrl: '/images/@next/relayer-logos/logo_1.png',
    },
    {
        name: 'Paradex',
        imageUrl: '/images/@next/relayer-logos/logo_5.png',
    },
    {
        name: 'Amadeus',
        imageUrl: '/images/@next/relayer-logos/logo_3.png',
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
    },
    {
        name: 'DDEX',
        imageUrl: '/images/@next/relayer-logos/logo_2.png',
    },
];

export const SectionLandingClients = () => (
    <Section isPadLarge={true}>
        <WrapCentered>
            <Heading size="small">You're in good company</Heading>
        </WrapCentered>

        <WrapGrid width="narrow" isWrapped={true}>
            {_.map(projects, (item: ProjectLogo, index) => (
                <StyledProject key={`client-${index}`}>
                    <img src={item.imageUrl} alt={item.name} />
                </StyledProject>
            ))}
        </WrapGrid>
    </Section>
);

const StyledProject = styled.div`
    width: 90px;
    height: 90px;
    flex-shrink: 0;
    margin: 30px;

    img {
        object-fit: contain;
        width: 100%;
        height: 100%;
    }
`;
