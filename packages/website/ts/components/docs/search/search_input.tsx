import React from 'react';
import { Configure, Index, InstantSearch } from 'react-instantsearch-dom';

import { AutoComplete } from 'ts/components/docs/search/autocomplete';

import { searchClient, searchIndex } from 'ts/utils/algolia_search';

interface ISearchInputProps {
    isHome?: boolean;
}

export const SearchInput: React.FC<ISearchInputProps> = ({ isHome }) => (
    <InstantSearch searchClient={searchClient} indexName={searchIndex.tools}>
        <AutoComplete isHome={isHome} />
        <Configure hitsPerPage={5} distinct={true} />
        <Index indexName={searchIndex.tools} />
        <Index indexName={searchIndex.guides} />
    </InstantSearch>
);
