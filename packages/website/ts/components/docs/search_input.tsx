import React from 'react';
import styled from 'styled-components';
import { CustomAutoComplete } from 'ts/components/docs/search/autocomplete';

import algoliasearch from 'algoliasearch/lite';
// import Autocomplete from 'react-autocomplete';
import { Configure, connectAutoComplete, Index, InstantSearch } from 'react-instantsearch-dom';

const searchClient = algoliasearch('VHMP18K2OO', 'e46d0171577e85fa5418c50b18f80ade');
// const index = searchClient.initIndex(['0x_tools_test']);

interface ISearchInputProps {
    isHome?: boolean;
}

const AutoComplete = connectAutoComplete(CustomAutoComplete);

export const SearchInput: React.FC<ISearchInputProps> = ({ isHome }) => (
    <InstantSearch
        searchClient={searchClient}
        indexName="0x_tools_test"
        root={{
            Root: 'div',
            props: {
                style: {},
            },
        }}
    >
        <Wrapper isHome={isHome}>
            <AutoComplete isHome={isHome} />
            <Configure hitsPerPage={5} distinct={true} />
            <Index indexName="0x_tools_test" />
            <Index indexName="0x_guides_test" />
            <Label>
                <LabelText>Search query</LabelText>
                {/* <Input isHome={isHome} />*/}
            </Label>
        </Wrapper>
    </InstantSearch>
);

const Wrapper = styled.div<ISearchInputProps>`
    width: 100%;
    max-width: 240px;
    position: relative;

    ${({ isHome }) =>
        isHome &&
        `
        max-width: 890px;
        margin: 0 auto;
    `};
`;

const Label = styled.label`
    position: relative;
`;

const LabelText = styled.span`
    position: absolute;
    opacity: 0;
    visibility: hidden;
`;

const Input = styled.input.attrs({
    placeholder: 'Search docs...',
})<ISearchInputProps>`
    background: url("data:image/svg+xml,%3Csvg width='24' height='24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23fff' fill-opacity='.01' d='M0 0h24v24H0z'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0zM10.5 3a7.5 7.5 0 1 0 4.55 13.463l4.743 4.744 1.414-1.414-4.744-4.744A7.5 7.5 0 0 0 10.5 3z' fill='%235C5C5C'/%3E%3C/svg%3E")
        transparent left center no-repeat;
    font-size: 1.375rem;
    padding: 18px 18px 21px 35px;
    width: 100%;
    border: 0;
    border-bottom: 1px solid #b4bebd;
    outline: none;

    ${props =>
        !props.isHome &&
        `
        background-color: #EBEEEC;
        border-bottom: 0;
        padding: 13px 21px 15px 52px;
        background-position: left 21px center;
        font-size: 1.125rem;
    `};

    &:before {
        content: '';
        width: 30px;
        height: 30px;
        opacity: 0.15;
        position: absolute;
        top: 0;
        left: 0;
    }
`;
