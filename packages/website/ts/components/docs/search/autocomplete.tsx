import React, { useState, useLayoutEffect } from 'react';
import Autosuggest from 'react-autosuggest';
import { connectAutoComplete, Highlight, Snippet } from 'react-instantsearch-dom';
import styled from 'styled-components';

import { Link } from '@0x/react-shared';

import { AutocompleteOverlay } from 'ts/components/docs/search/autocomplete_overlay';
import { AutocompleteWrapper } from 'ts/components/docs/search/autocomplete_wrapper';

import { searchIndex } from 'ts/utils/algolia_search';

interface IAutoCompleteProps {
    isHome?: boolean;
    hits?: object[];
    currentRefinement?: string;
    refine?: (value: string) => void;
}

interface IHitProps {
    [key: string]: any;
}

const CustomAutoComplete: React.FC<IAutoCompleteProps> = ({ isHome = false, hits = [], currentRefinement, refine }) => {
    const [value, setValue] = useState<string>('');

    const onChange = (event: IHitProps, { newValue }: IHitProps): void => setValue(newValue);

    const onSuggestionsFetchRequested = ({ value: newValue }: IHitProps): void => refine(newValue);

    const onSuggestionsClearRequested = (): void => refine('');

    // tslint:disable-next-line: no-empty
    const onSuggestionHighlighted = (): void => {};

    // tslint:disable-next-line: no-empty
    const onSuggestionSelected = (event: IHitProps, { suggestion }: IHitProps): void => {};

    const getSuggestionValue = (hit: IHitProps): string => hit.textContent;

    const renderSuggestion = (hit: IHitProps): React.ReactNode => {
        return (
            <Link to={hit.url}>
                <Highlight attribute="title" hit={hit} nonHighlightedTagName="h6" />
                <br />
                <Snippet attribute="textContent" hit={hit} nonHighlightedTagName="p" tagName="span" />
            </Link>
        );
    };

    const renderSectionTitle = (section: IHitProps): React.ReactNode => {
        const { tools, guides } = searchIndex;

        const titles: { [key: string]: any } = {
            [tools]: 'Tools',
            [guides]: 'Guides',
        };

        if (section.hits.length) {
            return <p>{titles[section.index]}</p>;
        }
        return null;
    };

    const getSectionSuggestions = (section: IHitProps): string => section.hits;

    const inputProps = {
        placeholder: 'Search docs…',
        onChange,
        value,
    };

    return (
        <>
            <AutocompleteWrapper currentRefinement={currentRefinement} isHome={isHome}>
                <Autosuggest
                    suggestions={hits}
                    multiSection={true}
                    onSuggestionSelected={onSuggestionSelected}
                    onSuggestionsFetchRequested={onSuggestionsFetchRequested}
                    onSuggestionHighlighted={onSuggestionHighlighted}
                    onSuggestionsClearRequested={onSuggestionsClearRequested}
                    getSuggestionValue={getSuggestionValue}
                    renderSuggestion={renderSuggestion}
                    inputProps={inputProps}
                    renderSectionTitle={renderSectionTitle}
                    getSectionSuggestions={getSectionSuggestions}
                />
            </AutocompleteWrapper>
            {currentRefinement && <AutocompleteOverlay onClick={onSuggestionsClearRequested} />}
        </>
    );
};

export const AutoComplete = connectAutoComplete(CustomAutoComplete);
