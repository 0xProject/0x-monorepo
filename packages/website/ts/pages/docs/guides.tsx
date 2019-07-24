import React from 'react';
import styled from 'styled-components';

import { DocsPageLayout } from 'ts/components/docs/layout/docs_page_layout';
import { Resource } from 'ts/components/docs/resource/resource';
import { Filters } from 'ts/components/docs/sidebar/filters';

import { Hits, InstantSearch } from 'react-instantsearch-dom';

import algoliasearch from 'algoliasearch/lite';

const searchClient = algoliasearch('39X6WOJZKW', '6acba761a34d99781628c6178af1e16c');

export const DocsGuides: React.FC = () => (
    <DocsPageLayout title="Guides">
        <InstantSearch searchClient={searchClient} indexName="0x_guides_test">
            <Columns>
                <Filters filters={filters} />
                <Hits hitComponent={Resource} />
            </Columns>
        </InstantSearch>
    </DocsPageLayout>
);

const Columns = styled.div`
    display: grid;
    grid-template-columns: 250px 1fr;
    grid-column-gap: 98px;
    grid-row-gap: 30px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

const filters = [
    {
        attribute: 'topics',
        heading: 'Topic',
    },
    {
        attribute: 'difficulty',
        heading: 'Level',
    },
];
