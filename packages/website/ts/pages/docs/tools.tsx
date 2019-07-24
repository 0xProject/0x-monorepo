import React from 'react';
import styled from 'styled-components';

import { FeatureLink } from 'ts/components/docs/feature_link';

import { Resource } from 'ts/components/docs/resource/resource';
import { Filters } from 'ts/components/docs/sidebar/filters';
import { Heading } from 'ts/components/text';

import { Columns } from 'ts/components/docs/layout/columns';
import { ContentWrapper } from 'ts/components/docs/layout/content_wrapper';
import { DocsPageLayout } from 'ts/components/docs/layout/docs_page_layout';
import { Separator } from 'ts/components/docs/separator';

import { Hits, InstantSearch } from 'react-instantsearch-dom';

import algoliasearch from 'algoliasearch/lite';

const searchClient = algoliasearch('39X6WOJZKW', '6acba761a34d99781628c6178af1e16c');

export const DocsTools: React.FC = () => {
    return (
        <DocsPageLayout title="Tools">
            <InstantSearch searchClient={searchClient} indexName="0x_tools_test">
                <Columns>
                    <Filters filters={filters} />
                    <Separator />
                    <ContentWrapper>
                        <Hits hitComponent={Resource} />

                        {/* <FeaturedToolsWrapper>
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
                            </FeaturedToolsWrapper> */}

                        {/* <ResourcesWrapper>
                                <Heading asElement="h2" size="default">
                                    Docker Images
                                </Heading>

                                {resources.map((resource, index) => (
                                    <Resource key={`resource-${index}`} {...resource} />
                                ))}
                            </ResourcesWrapper> */}
                        {/* 
                            <ResourcesWrapper>
                                <Heading asElement="h2" size="default">
                                    TypeScript Libraries
                                </Heading>

                                {resources.map((resource, index) => (
                                    <Resource key={`resource-${index}`} {...resource} />
                                ))}
                            </ResourcesWrapper> */}
                    </ContentWrapper>
                </Columns>
            </InstantSearch>
        </DocsPageLayout>
    );
};

const FeaturedToolsWrapper = styled.div`
    margin-bottom: 50px;
`;

const ResourcesWrapper = styled.div`
    margin-bottom: 40px;
`;

const filters = [
    { attribute: 'type', heading: 'Type' },
    { attribute: 'tags', heading: 'Developer Persona' },
    { attribute: 'difficulty', heading: 'Level' },
    { attribute: 'isCommunity', heading: 'Community Maintained', customLabel: 'Include Community Maintained' },
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
