import * as _ from 'lodash';
import * as React from 'react';
import { Configure, connectHits, InstantSearch } from 'react-instantsearch-dom';

import { Columns } from 'ts/components/docs/layout/columns';
import { DocsPageLayout } from 'ts/components/docs/layout/docs_page_layout';
import { Resource } from 'ts/components/docs/resource/resource';
import { Separator } from 'ts/components/docs/shared/separator';
import { Filters } from 'ts/components/docs/sidebar/filters';

import { IHit } from 'ts/components/docs/search/autocomplete';

import { difficultyOrder, getNameToSearchIndex, hitsPerPage, searchClient } from 'ts/utils/algolia_constants';
import { environments } from 'ts/utils/environments';

interface IHitsProps {
    hits: IHit[];
}

export const DocsGuides: React.FC = () => {
    const nameToSearchIndex = getNameToSearchIndex(environments.getEnvironment());
    return (
        <DocsPageLayout title="Guides">
            <InstantSearch searchClient={searchClient} indexName={nameToSearchIndex.guides}>
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

const Hits: React.FC<IHitsProps> = ({ hits }) => {
    return (
        <div>
            {difficultyOrder.map(difficulty => {
                const filteredHits = hits.filter((hit: any) => hit.difficulty === difficulty);
                const sortedHits = _.orderBy(filteredHits, [hit => hit.title.toLowerCase()], ['asc']);

                return sortedHits.map((hit: any, index: number) => <Resource key={`resource-${index}`} hit={hit} />);
            })}
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
