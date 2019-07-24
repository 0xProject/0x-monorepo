import React from 'react';
import { Hits, InstantSearch } from 'react-instantsearch-dom';
import styled from 'styled-components';

import { FeatureLink } from 'ts/components/docs/feature_link';

import { Resource } from 'ts/components/docs/resource/resource';
import { Filters } from 'ts/components/docs/sidebar/filters';
import { Heading } from 'ts/components/text';

import { Columns } from 'ts/components/docs/layout/columns';
import { ContentWrapper } from 'ts/components/docs/layout/content_wrapper';
import { DocsPageLayout } from 'ts/components/docs/layout/docs_page_layout';
import { Separator } from 'ts/components/docs/separator';

import { searchClient, searchIndex } from 'ts/utils/algolia_search';

export const DocsTools: React.FC = () => {
    return (
        <DocsPageLayout title="Tools">
            <InstantSearch searchClient={searchClient} indexName={searchIndex.tools}>
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
