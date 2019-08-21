import * as _ from 'lodash';
import * as React from 'react';
import { Configure, connectHits, InstantSearch } from 'react-instantsearch-dom';

import { Columns } from 'ts/components/docs/layout/columns';
import { DocsPageLayout } from 'ts/components/docs/layout/docs_page_layout';
import { Resource } from 'ts/components/docs/resource/resource';
import { Separator } from 'ts/components/docs/shared/separator';
import { Filters } from 'ts/components/docs/sidebar/filters';

import { hitsPerPage, searchClient, searchIndices } from 'ts/utils/algolia_constants';

export const DocsGuides: React.FC = () => {
    return (
        <DocsPageLayout title="Guides">
            <InstantSearch searchClient={searchClient} indexName={searchIndices.guides}>
                <Configure hitsPerPage={hitsPerPage.pages} />
                <Columns>
                    <Filters filters={filters} />
                    <Separator />
                    <CustomHits />
                </Columns>
            </InstantSearch>
        </DocsPageLayout>
    );
};

const Hits: React.FC<any> = ({ hits }): any => {
    const sortedHits = _.orderBy(hits, ['title'], ['asc']);

    return (
        <div>
            {sortedHits.map((hit: any, index: number) => (
                <Resource key={`resource-${index}`} hit={hit} />
            ))}
        </div>
    );
};

const CustomHits = connectHits(Hits);

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
