import React from 'react';
import styled from 'styled-components';

import { FeatureLink } from 'ts/components/docs/feature_link';
import { Hero } from 'ts/components/docs/hero';
import { Resource } from 'ts/components/docs/resource/resource';
import { FilterGroup, Filters } from 'ts/components/docs/sidebar/filters';
import { SiteWrap } from 'ts/components/docs/siteWrap';
import { DocumentTitle } from 'ts/components/document_title';
import { Section } from 'ts/components/newLayout';
import { Heading } from 'ts/components/text';

import { documentConstants } from 'ts/utils/document_meta_constants';

export const DocsTools: React.FC = () => {
    return (
        <SiteWrap theme="light">
            <DocumentTitle {...documentConstants.DOCS} />
            <Hero isHome={false} title="Tools" />
            <Section maxWidth="1030px" isPadded={false}>
                <Columns>
                    <Filters groups={filterGroups} />
                    <article>
                        <FeaturedToolsWrapper>
                            <Heading asElement="h2" size="default">
                                Featured Tools
                            </Heading>
                            {featuredLinks.map((link, index) => (
                                <FeatureLink
                                    key={`featuredLink-${index}`}
                                    heading={link.heading}
                                    description={link.description}
                                    icon={link.icon}
                                    url={link.url}
                                />
                            ))}
                        </FeaturedToolsWrapper>

                        <ResourcesWrapper>
                            <Heading asElement="h2" size="default">
                                Docker Images
                            </Heading>

                            {resources.map((resource, index) => (
                                <Resource
                                    key={`resource-${index}`}
                                    heading={resource.heading}
                                    description={resource.description}
                                    tags={resource.tags}
                                    url={resource.url}
                                />
                            ))}
                        </ResourcesWrapper>

                        <ResourcesWrapper>
                            <Heading asElement="h2" size="default">
                                TypeScript Libraries
                            </Heading>

                            {resources.map((resource, index) => (
                                <Resource
                                    key={`resource-${index}`}
                                    heading={resource.heading}
                                    description={resource.description}
                                    tags={resource.tags}
                                    url={resource.url}
                                />
                            ))}
                        </ResourcesWrapper>
                    </article>
                </Columns>
            </Section>
        </SiteWrap>
    );
};

const Columns = styled.div`
    display: grid;
    grid-template-columns: 250px 1fr;
    grid-column-gap: 98px;
    grid-row-gap: 30px;
`;

const FeaturedToolsWrapper = styled.div`
    margin-bottom: 50px;
`;

const ResourcesWrapper = styled.div`
    margin-bottom: 40px;
`;

const filterGroups: FilterGroup[] = [
    {
        heading: 'Type',
        name: 'type',
        filters: [
            {
                value: 'Docker images',
                label: 'Docker images',
            },
            {
                value: 'Typescript/Javascript Libraries',
                label: 'Typescript/Javascript Libraries',
            },
            {
                value: 'Python Libraries',
                label: 'Python Libraries',
            },
            {
                value: 'Golang Libraries',
                label: 'Golang Libraries',
            },
            {
                value: 'Starter projects',
                label: 'Starter projects',
            },
            {
                value: 'Command-line tools',
                label: 'Command-line tools',
            },
        ],
    },
    {
        heading: 'Developer Persona',
        name: 'developerPersona',
        filters: [
            {
                value: 'Relayer',
                label: 'Relayer',
            },
            {
                value: 'Trader',
                label: 'Trader',
            },
            {
                value: 'Instant integrator',
                label: 'Instant integrator',
            },
            {
                value: 'Protocol developer',
                label: 'Protocol developer',
            },
        ],
    },
    {
        heading: 'Level',
        name: 'level',
        filters: [
            {
                value: 'Beginner',
                label: 'Beginner',
            },
            {
                value: 'Intermediate',
                label: 'Intermediate',
            },
            {
                value: 'Advanced',
                label: 'Advanced',
            },
        ],
    },
    {
        heading: 'Communtity Maintained',
        name: 'communityMaintained',
        filters: [
            {
                value: '1',
                label: 'Include Community Maintained',
            },
        ],
    },
];

const featuredLinks = [
    {
        heading: '0x Code Sandbox',
        description: 'A description could possibly go here but could be tight.',
        icon: 'flexibleIntegration',
        url: 'https://0x.org',
    },
    {
        heading: '0x Code Sandbox',
        description: 'A description could possibly go here but could be tight.',
        icon: 'flexibleIntegration',
        url: 'https://0x.org',
    },
];

const resources = [
    {
        heading: '0x Mesh - your gateway to networked liquidity',
        description:
            'Learn about the 0x peer-to-peer network for sharing orders and how you can use it to tap into networked liquidity.',
        tags: [{ label: 'Relayer' }],
        url: 'https://0x.org',
    },
    {
        heading: '0x Mesh - your gateway to networked liquidity',
        description:
            'The Radar Relay SDK is a software development kit that simplifies the interactions with Radar Relay’s APIs',
        tags: [{ label: 'Community Maintained', isInverted: true }, { label: 'Relayer' }],
        url: 'https://0x.org',
    },
];
