import * as React from 'react';
import { connectHits, InstantSearch } from 'react-instantsearch-dom';
import styled from 'styled-components';

import { FeatureLink } from 'ts/components/docs/tools/feature_link';

import { Resource } from 'ts/components/docs/resource/resource';
import { Filters } from 'ts/components/docs/sidebar/filters';
import { Heading } from 'ts/components/text';

import { Columns } from 'ts/components/docs/layout/columns';
import { ContentWrapper } from 'ts/components/docs/layout/content_wrapper';
import { DocsPageLayout } from 'ts/components/docs/layout/docs_page_layout';
import { Separator } from 'ts/components/docs/separator';

import { searchClient, searchIndices } from 'ts/utils/algolia_constants';

interface IHitsProps {
    hits: IHit[];
}
interface IHit {
    description: string;
    difficulty: string;
    id: number | string;
    isCommunity?: boolean;
    isFeatured?: boolean;
    objectID: string;
    tags?: string[];
    textContent: string;
    title: string;
    type?: string;
    url: string;
    _highlightResult: any;
    _snippetResult: any;
}

export const DocsTools: React.FC = () => {
    return (
        <DocsPageLayout title="Tools">
            <InstantSearch searchClient={searchClient} indexName={searchIndices.tools}>
                <Columns>
                    <Filters filters={filters} />
                    <Separator />
                    <ContentWrapper>
                        <CustomHits />
                    </ContentWrapper>
                </Columns>
            </InstantSearch>
        </DocsPageLayout>
    );
};

function getUniqueContentTypes(hits: IHit[]): string[] {
    const contentTypes: string[] = [];
    // @ts-ignore
    for (const hit of hits) {
        if (!contentTypes.includes(hit.type)) {
            contentTypes.push(hit.type);
        }
    }

    return contentTypes;
}

const Hits: React.FC<IHitsProps> = ({ hits }) => {
    const contentTypes = getUniqueContentTypes(hits);
    const featuredTools = hits.filter((hit: IHit) => hit.isFeatured);

    return (
        <>
            {featuredTools.length > 0 && (
                <FeaturedToolsWrapper>
                    <Heading asElement="h2" size="default">
                        Featured Tools
                    </Heading>
                    {featuredTools.map((hit: IHit, index: number) => (
                        <FeatureLink key={`featuredLink-${index}`} {...hit} />
                    ))}
                </FeaturedToolsWrapper>
            )}

            {contentTypes.map(type => {
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
