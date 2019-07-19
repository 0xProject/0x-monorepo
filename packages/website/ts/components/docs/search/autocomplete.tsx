import React, { useState } from 'react';
import styled from 'styled-components';

// import Autocomplete from 'react-autocomplete';
import Autosuggest from 'react-autosuggest';
import { Highlight, Snippet } from 'react-instantsearch-dom';

import { colors } from 'ts/style/colors';

interface Props {
    isHome?: boolean;
}

interface AutoCompleteProps {
    isHome?: boolean;
    hits?: object[];
    currentRefinement?: string;
    refine?: (value: string) => void;
}

interface HitProps {
    [key: string]: any;
}

export const CustomAutoComplete: React.FC<AutoCompleteProps> = ({
    isHome = false,
    hits = [],
    currentRefinement = '',
    refine,
}) => {
    const [value, setValue] = useState<string>('');

    const onChange = (event: HitProps, { newValue }: HitProps): void => setValue(newValue);

    const onSuggestionsFetchRequested = ({ value: newValue }: HitProps): void => refine(newValue);

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
            <>
                <Highlight attribute="title" hit={hit} nonHighlightedTagName="h6" />
                <br />
                {/* <Snippet attribute="textContent" hit={hit} nonHighlightedTagName="p" /> */}
            </>
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

    @media (max-width: 800px) {
        margin: 30px 18px;
    }
`;

const Wrapper = styled.div<Props>`
    position: relative;

    .react-autosuggest__container {
        border: 1px solid orangered;

        &--open {
            background-color: ${colors.white};
            border-color: #dbdfdd;
        }

        ${({ isHome }) =>
            isHome &&
            `
            padding: 13px 30px;
        `};
    }

    .react-autosuggest__section-container {
        display: flex;
    }

    .react-autosuggest__suggestions-container {
        position: absolute;
        right: 0;
        left: 0;
        background-color: ${colors.white};
        z-index: 10;
        /* width: 890px; */

        flex-grow: 1;
        overflow-x: hidden;
        overflow-y: scroll;

        &--open {
            border: 1px solid #dbdfdd;
            border-top: none;
            height: 70vh;
        }

        ${({ isHome }) =>
            !isHome &&
            `
            top: 50px;
        `};
    }

    .react-autosuggest__suggestions-list {
        flex-grow: 1;
        width: 100%;
    }

    .react-autosuggest__suggestion {
        /* color: ${colors.brandDark}; */
        /* font-size: 0.85rem; */
        /* line-height: 1.4;
        font-weight: 400; */
        /* padding: 25px 30px 25px 178px; */
        padding: 25px 30px 25px 100px;
        min-height: 110px;
        border-bottom: 1px solid #eee;

        display: flex;
        flex-direction: column;

        transition: background-color 300ms ease-in-out;

        &--highlighted {
            background-color: ${colors.backgroundLight};
        }

        h6 {
            display: inline;
            color: ${colors.brandDark};
            font-size: var(--smallHeading);
            font-weight: 300;
        }

        em {
            font-size: var(--smallHeading);
            font-weight: 400;
        }

        p {
            color: ${colors.textDarkSecondary};
            font-size: var(--smallParagraph);
            margin-bottom: 0;
            border: 1px solid orange;
        }
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

            &--focused,
            &--open {
                background-color: white;
                // width: 890px;
                // position: absolute;
                // right: 0;
                // top: 0;
            }
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
`;
