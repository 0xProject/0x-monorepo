import React from 'react';
import styled from 'styled-components';

import { FeatureLink } from 'ts/components/docs/feature_link';
import { Hero } from 'ts/components/docs/hero';
import { Resource } from 'ts/components/docs/resource/resource';
import { Filters } from 'ts/components/docs/sidebar/filters';
import { SiteWrap } from 'ts/components/docs/siteWrap';
import { DocumentTitle } from 'ts/components/document_title';
import { Section } from 'ts/components/newLayout';
import { Heading } from 'ts/components/text';

import { documentConstants } from 'ts/utils/document_meta_constants';

import { ClearRefinements, Hits, InstantSearch } from 'react-instantsearch-dom';

import algoliasearch from 'algoliasearch/lite';

const searchClient = algoliasearch('39X6WOJZKW', '6acba761a34d99781628c6178af1e16c');

export const DocsTools: React.FC = () => {
    return (
        <SiteWrap theme="light">
            <DocumentTitle {...documentConstants.DOCS} />
            <Hero title="Tools" />
            <Section maxWidth="1030px" isPadded={false}>
                <InstantSearch searchClient={searchClient} indexName="0x_tools_test">
                    <ClearRefinements />

                    <Columns>
                        <Filters filters={filters} />
                        <article>
                            <Hits />

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
                                    <Resource key={`resource-${index}`} {...resource} />
                                ))}
                            </ResourcesWrapper>

                            <ResourcesWrapper>
                                <Heading asElement="h2" size="default">
                                    TypeScript Libraries
                                </Heading>

                                {resources.map((resource, index) => (
                                    <Resource key={`resource-${index}`} {...resource} />
                                ))}
                            </ResourcesWrapper>
                        </article>
                    </Columns>
                </InstantSearch>
            </Section>
        </SiteWrap>
    );
};

const Columns = styled.div`
    display: grid;
    grid-template-columns: 250px 1fr;
    grid-column-gap: 98px;
    grid-row-gap: 30px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

const FeaturedToolsWrapper = styled.div`
    margin-bottom: 50px;
`;

const ResourcesWrapper = styled.div`
    margin-bottom: 40px;
`;

const filters = [
    { attribute: 'tags', heading: 'Developer persona' },
    { attribute: 'difficulty', heading: 'Difficulty' },
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
        tags: ['Relayer', 'Dogs', 'Bells and whistles', 'Interstellar', 'Maharaji'],
        url: 'https://0x.org',
        isCommunity: true,
    },
    {
        heading: '0x Mesh - your gateway to networked liquidity',
        description:
            'The Radar Relay SDK is a software development kit that simplifies the interactions with Radar Relay’s APIs',
        tags: ['Api explorer', 'Relayer'],
        url: 'https://0x.org',
    },
];
