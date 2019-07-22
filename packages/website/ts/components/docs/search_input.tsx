import React from 'react';

import algoliasearch from 'algoliasearch/lite';
import { Configure, connectAutoComplete, Index, InstantSearch } from 'react-instantsearch-dom';

import { CustomAutoComplete } from 'ts/components/docs/search/autocomplete';

const searchClient = algoliasearch('39X6WOJZKW', '6acba761a34d99781628c6178af1e16c');

interface ISearchInputProps {
    isHome?: boolean;
}

const AutoComplete = connectAutoComplete(CustomAutoComplete);

export const SearchInput: React.FC<ISearchInputProps> = ({ isHome }) => (
    <InstantSearch
        searchClient={searchClient}
        indexName="0x_tools_test"
        onSearchStateChange={(searchState: any) => {
            // console.log('searchState', searchState);
        }}
    >
        <AutoComplete isHome={isHome} />
        <Configure hitsPerPage={5} distinct={true} />
        <Index indexName="0x_tools_test" />
        <Index indexName="0x_guides_test" />
    </InstantSearch>
);
