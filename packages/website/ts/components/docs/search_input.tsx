import React from 'react';
import styled from 'styled-components';

import { CustomAutoComplete } from 'ts/components/docs/search/autocomplete';

import algoliasearch from 'algoliasearch/lite';
import { Configure, connectAutoComplete, Index, InstantSearch } from 'react-instantsearch-dom';

const searchClient = algoliasearch('VHMP18K2OO', 'e46d0171577e85fa5418c50b18f80ade');

interface ISearchInputProps {
    isHome?: boolean;
}

const AutoComplete = connectAutoComplete(CustomAutoComplete);

export const SearchInput: React.FC<ISearchInputProps> = ({ isHome }) => (
    <InstantSearch
        searchClient={searchClient}
        indexName="0x_tools_test"
        onSearchStateChange={(searchState: any) => {
            console.log('searchState', searchState);
        }}
    >
        <Wrapper isHome={isHome}>
            <AutoComplete isHome={isHome} />
            <Configure hitsPerPage={5} distinct={true} />
            <Index indexName="0x_tools_test" />
            <Index indexName="0x_guides_test" />
        </Wrapper>
    </InstantSearch>
);

const Wrapper = styled.div<ISearchInputProps>`
    width: 100%;
    position: relative;

    ${({ isHome }) =>
        isHome &&
        `
        max-width: 890px;
        margin: 0 auto;
    `};
`;
