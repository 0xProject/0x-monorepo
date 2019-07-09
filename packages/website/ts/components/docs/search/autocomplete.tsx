import React from 'react';
import styled from 'styled-components';

// import Autocomplete from 'react-autocomplete';
import Autosuggest from 'react-autosuggest';
import { Highlight, Snippet } from 'react-instantsearch-dom';

interface Props {
    isHome?: boolean;
}

interface ToolsHit {
    objectID: string;
    title: string;
}

interface AutoCompleteProps {
    isHome?: boolean;
    hits: object[];
    currentRefinement: string;
    refine?: (value: string) => void;
}

interface AutoCompleteState {
    value: string;
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

export class CustomAutoComplete extends React.Component<AutoCompleteProps, AutoCompleteState> {
    public static defaultProps: AutoCompleteProps = {
        isHome: false,
        hits: [],
        currentRefinement: '',
    };
    constructor(props: AutoCompleteProps) {
        super(props);
        this.state = {
            value: '',
        };
    }
    public render(): React.ReactNode {
        const { hits, isHome } = this.props;
        const { value } = this.state;

        const inputProps = {
            placeholder: 'Search docs',
            onChange: this._onChange.bind(this),
            value,
        };

        return (
            <Wrapper isHome={isHome}>
                <Autosuggest
                    highlightFirstSuggestion={true}
                    theme={theme}
                    suggestions={hits}
                    multiSection={true}
                    onSuggestionSelected={this._onSuggestionSelected.bind(this)}
                    onSuggestionsFetchRequested={this._onSuggestionsFetchRequested.bind(this)}
                    onSuggestionHighlighted={this._onSuggestionHighlighted.bind(this)}
                    onSuggestionsClearRequested={this._onSuggestionsClearRequested.bind(this)}
                    getSuggestionValue={this._getSuggestionValue.bind(this)}
                    renderSuggestion={this._renderSuggestion.bind(this)}
                    inputProps={inputProps}
                    renderSectionTitle={this._renderSectionTitle.bind(this)}
                    getSectionSuggestions={this._getSectionSuggestions.bind(this)}
                />
            </Wrapper>
        );
    }
    private _onChange(event: HitProps, { newValue }: HitProps): void {
        this.setState({
            value: newValue,
        });
    }

    private _onSuggestionsFetchRequested({ value }: HitProps): void {
        this.props.refine(value);
    }

    private _onSuggestionsClearRequested(): void {
        this.props.refine('');
    }

    // tslint:disable-next-line: no-empty
    private _onSuggestionHighlighted(): void {}

    private _getSuggestionValue(hit: HitProps): string {
        return hit.textContent;
    }

    private _onSuggestionSelected(event: HitProps, { suggestion }: HitProps): void {
        // tslint:disable-next-line: no-console
        console.log(suggestion);
    }

    private _renderSuggestion(hit: HitProps): React.ReactNode {
        return (
            <HitWrapper>
                <Highlight attribute="title" hit={hit} tagName="mark" />
                <Snippet attribute="textContent" hit={hit} tagName="mark" />
            </HitWrapper>
        );
    }

    private _renderSectionTitle(section: HitProps): React.ReactNode {
        const titles: { [key: string]: any } = {
            '0x_tools_test': 'Tools',
            '0x_guides_test': 'Guides',
        };
        return <SectionWrapper>{titles[section.index]}</SectionWrapper>;
    }

    private _getSectionSuggestions(section: HitProps): string {
        return section.hits;
    }
}

const SectionWrapper = styled.div`
    color: #5c5c5c;
    font-size: 0.777777778rem;
    padding: 19px 20px 0;
    background: #eee;
    min-width: 90px;
    min-height: 52px;

    &:not(:first-child) {
        margin-top: 10px;
    }
`;

const HitWrapper = styled.div`
    display: flex;
    align-items: flex-start;
`;

const Wrapper = styled.div<Props>`
    position: relative;

    .react-autosuggest__container {
    }

    .react-autosuggest__section-container {
        display: flex;
    }

    .react-autosuggest__suggestions-container {
        position: absolute;
        right: 0;
        background-color: #fff;
        z-index: 10;
        min-width: 420px;
        width: 100%;
        flex-grow: 1;
    }

    .react-autosuggest__suggestions-list {
        flex-grow: 1;
    }

    .react-autosuggest__input {
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
            font-size: 1rem;
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
    }

    .react-autosuggest__suggestion {
        color: #003831;
        font-size: 0.85rem;
        line-height: 1.4;
        font-weight: 400;
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
    }

    .react-autosuggest__suggestion--highlighted {
        background-color: #eee;
    }
`;
