import * as React from 'react';
import { Configure, Index, InstantSearch } from 'react-instantsearch-dom';

import { AutoComplete } from 'ts/components/docs/search/autocomplete';

import { searchClient, searchIndices } from 'ts/utils/algolia_search';

interface ISearchInputProps {
    isHome?: boolean;
}

export const SearchInput: React.FC<ISearchInputProps> = ({ isHome }) => (
    <InstantSearch searchClient={searchClient} indexName={searchIndices.tools}>
        <AutoComplete isHome={isHome} />
        <Configure hitsPerPage={5} distinct={true} />
        <Index indexName={searchIndices.tools} />
        <Index indexName={searchIndices.guides} />
        <Index indexName={searchIndices['core-concepts']} />
    </InstantSearch>
);
