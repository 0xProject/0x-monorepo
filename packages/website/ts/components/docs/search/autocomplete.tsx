import React, { useState } from 'react';
import styled from 'styled-components';

// import Autocomplete from 'react-autocomplete';
import Autosuggest from 'react-autosuggest';
import { Highlight, Snippet } from 'react-instantsearch-dom';

import { colors } from 'ts/style/colors';

interface Props {
    isHome?: boolean;
}

// interface ToolsHit {
//     objectID: string;
//     title: string;
// }

interface AutoCompleteProps {
    isHome?: boolean;
    hits?: object[];
    currentRefinement?: string;
    refine?: (value: string) => void;
}

interface HitProps {
    [key: string]: any;
}

interface AutosuggestThemeClasses {
    [key: string]: any;
}

const theme: AutosuggestThemeClasses = {
    container: 'react-autosuggest__container',
    containerOpen: 'react-autosuggest__container--open',
    input: 'react-autosuggest__input',
    inputOpen: 'react-autosuggest__input--open',
    inputFocused: 'react-autosuggest__input--focused',
    suggestionsContainer: 'react-autosuggest__suggestions-container',
    suggestionsContainerOpen: 'react-autosuggest__suggestions-container--open',
    suggestionsList: 'react-autosuggest__suggestions-list',
    suggestion: 'react-autosuggest__suggestion',
    suggestionFirst: 'react-autosuggest__suggestion--first',
    suggestionHighlighted: 'react-autosuggest__suggestion--highlighted',
    sectionContainer: 'react-autosuggest__section-container',
    sectionContainerFirst: 'react-autosuggest__section-container--first',
    sectionTitle: 'react-autosuggest__section-title',
};

export const CustomAutoComplete: React.FC<AutoCompleteProps> = ({
    isHome = false,
    hits = [],
    currentRefinement = '',
    refine,
}) => {
    const [value, setValue] = useState<string>('');

    const onChange = (event: HitProps, { newValue }: HitProps): void => {
        setValue(newValue);
    };

    const onSuggestionsFetchRequested = ({ newValue }: HitProps): void => {
        refine(newValue);
    };

    const onSuggestionsClearRequested = (): void => refine('');

    // tslint:disable-next-line: no-empty
    const onSuggestionHighlighted = (): void => {};

    const getSuggestionValue = (hit: HitProps): string => hit.textContent;

    const onSuggestionSelected = (event: HitProps, { suggestion }: HitProps): void => {
        // tslint:disable-next-line: no-console
        console.log(suggestion);
    };

    const renderSuggestion = (hit: HitProps): React.ReactNode => {
        return (
            <HitWrapper>
                <Highlight attribute="title" hit={hit} tagName="mark" />
                <Snippet attribute="textContent" hit={hit} tagName="mark" />
            </HitWrapper>
        );
    };

    const renderSectionTitle = (section: HitProps): React.ReactNode => {
        const titles: { [key: string]: any } = {
            '0x_tools_test': 'Tools',
            '0x_guides_test': 'Guides',
        };
        return <SectionTitle>{titles[section.index]}</SectionTitle>;
    };

    const getSectionSuggestions = (section: HitProps): string => section.hits;

    const inputProps = {
        placeholder: 'Search docs',
        onChange,
        value,
    };

    return (
        <Wrapper isHome={isHome}>
            <Autosuggest
                theme={theme}
                suggestions={hits}
                multiSection={true}
                highlightFirstSuggestion={true}
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
        </Wrapper>
    );
};

const SectionTitle = styled.p`
    color: ${colors.brandDark};
    background-color: rgba(0, 56, 49, 0.1);
    border-radius: 4px;
    font-size: 12px;
    padding: 7px 10px 5px;
    text-transform: uppercase;
    position: absolute;
    margin: 30px;
`;

const HitWrapper = styled.div`
    display: flex;
    align-items: flex-start;
`;

const Wrapper = styled.div<Props>`
    position: relative;

    .react-autosuggest__container {
        padding: 13px 30px;
        border: 1px solid transparent;

        &--open {
            background-color: ${colors.white};
            border-color: #dbdfdd;
        }
    }

    .react-autosuggest__section-container {
        display: flex;
    }

    .react-autosuggest__suggestions-container {
        position: absolute;
        right: 0;
        background-color: ${colors.white};
        z-index: 10;
        min-width: 420px;
        width: 100%;
        flex-grow: 1;

        &--open {
            border: 1px solid #dbdfdd;
            border-top: none;
        }
    }

    .react-autosuggest__suggestions-list {
        flex-grow: 1;
    }

    .react-autosuggest__input {
        background: url("data:image/svg+xml,%3Csvg width='24' height='24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23fff' fill-opacity='.01' d='M0 0h24v24H0z'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0zM10.5 3a7.5 7.5 0 1 0 4.55 13.463l4.743 4.744 1.414-1.414-4.744-4.744A7.5 7.5 0 0 0 10.5 3z' fill='%235C5C5C'/%3E%3C/svg%3E")
            transparent left center no-repeat;
        font-size: 22px;
        padding: 18px 18px 21px 35px;
        width: 100%;
        border: 0;
        border-bottom: 1px solid #b4bebd;
        outline: none;

        ${({ isHome }) =>
            !isHome &&
            `
            background-color: #EBEEEC;
            border-bottom: 0;
            padding: 13px 21px 15px 52px;
            background-position: left 21px center;
            font-size: 1rem;
        `};

        &--open {
            border-bottom-color: ${colors.brandLight};
        }

        &:before {
            content: '';
            width: 30px;
            height: 30px;
            opacity: 0.15;
            position: absolute;
            top: 0;
            left: 0;
        }
    }

    .react-autosuggest__suggestion {
        color: ${colors.brandDark};
        font-size: 0.85rem;
        line-height: 1.4;
        font-weight: 400;
        padding: 25px 30px 25px 178px;
        min-height: 110px;
        border-bottom: 1px solid #eee;
        transition: background-color 300ms ease-in-out;

        &--highlighted {
            background-color: ${colors.backgroundLight};
        }
    }
`;
