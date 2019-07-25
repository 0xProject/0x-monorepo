import React from 'react';
import { connectHits, InstantSearch } from 'react-instantsearch-dom';
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
                        {/* <Hits hitComponent={Resource} /> */} <CustomHits />
                    </ContentWrapper>
                </Columns>
            </InstantSearch>
        </DocsPageLayout>
    );
};

// @ts-ignore
const getUniqueContentTypes = hits => {
    // @ts-ignore
    const types = [];

    for (const hit of hits) {
        // @ts-ignore
        if (!types.includes(hit.type)) {
            types.push(hit.type);
        }
    }

    return types;
};

// @ts-ignore
const Hits = ({ hits }) => {
    const types = getUniqueContentTypes(hits);

    console.log('types', types);
    return (
        <>
            {types.map(type => {
                const filteredHits = hits.filter((hit: any) => hit.type === type);

                return (
                    <ResourcesWrapper key={type}>
                        <Heading asElement="h2" size="default">
                            {type}
                        </Heading>
                        {filteredHits.map((hit: any, index: number) => (
                            <Resource key={`resource-${index}`} hit={hit} />
                        ))}
                    </ResourcesWrapper>
                );
            })}
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
            </ResourcesWrapper> */}
        </>
    );
};

const CustomHits = connectHits(Hits);

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
