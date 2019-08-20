import * as React from 'react';
import { Configure, Index, InstantSearch } from 'react-instantsearch-dom';

import { AutoComplete } from 'ts/components/docs/search/autocomplete';

import { hitsPerPage, searchClient, searchIndices } from 'ts/utils/algolia_constants';

interface ISearchInputProps {
    isHome?: boolean;
}

export const SearchInput: React.FC<ISearchInputProps> = ({ isHome }) => (
    <InstantSearch searchClient={searchClient} indexName={searchIndices.tools}>
        <AutoComplete isHome={isHome} />
        <Configure hitsPerPage={hitsPerPage.autocomplete} />
        {/* We could map these when we decide to show api explorer in search results */}
        <Index indexName={searchIndices.tools} />
        <Index indexName={searchIndices.guides} />
        <Index indexName={searchIndices['core-concepts']} />
        {/*
            TODO: Add this back in when api-explorer page is ready
            to be indexed and included in the search results (ditto in autocomplete.tsx)
            <Index indexName={searchIndices['api-explorer']} />
        */}
    </InstantSearch>
);
