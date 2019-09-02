import * as React from 'react';
import { Configure, Index, InstantSearch } from 'react-instantsearch-dom';

import { AutoComplete } from 'ts/components/docs/search/autocomplete';

import { getNameToSearchIndex, hitsPerPage, searchClient } from 'ts/utils/algolia_constants';
import { environments } from 'ts/utils/environments';

interface ISearchInputProps {
    isHome?: boolean;
}

export const SearchInput: React.FC<ISearchInputProps> = ({ isHome }) => {
    const nameToSearchIndex = getNameToSearchIndex(environments.getEnvironment());
    const defaultIndex = nameToSearchIndex['core-concepts'];

    return (
        <InstantSearch searchClient={searchClient} indexName={defaultIndex}>
            <AutoComplete isHome={isHome} />
            <Configure hitsPerPage={hitsPerPage.autocomplete} />
            <Index indexName={nameToSearchIndex.guides} />
            <Index indexName={nameToSearchIndex.tools} />
            {/*
                TODO: Add this back in when api-explorer page is ready
                to be indexed and included in the search results (ditto in autocomplete.tsx)
                <Index indexName={nameToSearchIndex.api-explorer} />
            */}
        </InstantSearch>
    );
};
