import * as React from 'react';
import { Configure, Index, InstantSearch } from 'react-instantsearch-dom';

import { AutoComplete } from 'ts/components/docs/search/autocomplete';

import { hitsPerPage, searchClient, getNameToSearchIndex } from 'ts/utils/algolia_constants';
import { environments } from 'ts/utils/environments';

interface ISearchInputProps {
    isHome?: boolean;
}

export const SearchInput: React.FC<ISearchInputProps> = ({ isHome }) => {
    const nameToSearchIndex = getNameToSearchIndex(environments.getEnvironment());
    return (
        <InstantSearch searchClient={searchClient} indexName={nameToSearchIndex.tools}>
            <AutoComplete isHome={isHome} />
            <Configure hitsPerPage={hitsPerPage.autocomplete} />
            {/* We could map these when we decide to show api explorer in search results */}
            <Index indexName={nameToSearchIndex.tools} />
            <Index indexName={nameToSearchIndex.guides} />
            <Index indexName={nameToSearchIndex['core-concepts']} />
            {/*
                TODO: Add this back in when api-explorer page is ready
                to be indexed and included in the search results (ditto in autocomplete.tsx)
                <Index indexName={nameToSearchIndex.api-explorer} />
            */}
        </InstantSearch>
    );
};
