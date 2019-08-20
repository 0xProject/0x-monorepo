import * as React from 'react';
import { Configure, Hits, InstantSearch } from 'react-instantsearch-dom';

import { Columns } from 'ts/components/docs/layout/columns';
import { DocsPageLayout } from 'ts/components/docs/layout/docs_page_layout';
import { Resource } from 'ts/components/docs/resource/resource';
import { Separator } from 'ts/components/docs/shared/separator';
import { Filters } from 'ts/components/docs/sidebar/filters';

import { hitsPerPage, searchClient, searchIndices } from 'ts/utils/algolia_constants';

export const DocsGuides: React.FC = () => (
    <DocsPageLayout title="Guides">
        <InstantSearch searchClient={searchClient} indexName={searchIndices.guides}>
            <Configure hitsPerPage={hitsPerPage.pages} />
            <Columns>
                <Filters filters={filters} />
                <Separator />
                <Hits hitComponent={Resource} />
            </Columns>
        </InstantSearch>
    </DocsPageLayout>
);

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
