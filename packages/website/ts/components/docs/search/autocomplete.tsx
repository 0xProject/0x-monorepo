import * as React from 'react';
import Autosuggest from 'react-autosuggest';
import { connectAutoComplete, Highlight, Snippet } from 'react-instantsearch-dom';

import { Link } from 'ts/components/documentation/shared/link';

import { AutocompleteOverlay } from 'ts/components/docs/search/autocomplete_overlay';
import { AutocompleteWrapper } from 'ts/components/docs/search/autocomplete_wrapper';

import { searchIndices } from 'ts/utils/algolia_search';

interface IHit {
    description: string;
    difficulty: string;
    id: number | string;
    isCommunity?: boolean;
    isFeatured?: boolean;
    objectID: string;
    tags?: string[];
    textContent: string;
    title: string;
    type?: string;
    url: string;
    _highlightResult: any;
    _snippetResult: any;
}
interface ISnippetMatchLevels {
    [index: string]: number;
}

interface IAutoCompleteProps {
    isHome?: boolean;
    hits?: object[];
    currentRefinement?: string;
    refine?: (value: string) => void;
}

const SNIPPET_MATCH_LEVELS: ISnippetMatchLevels = { none: 0, partial: 1, full: 2 };

const CustomAutoComplete: React.FC<IAutoCompleteProps> = ({ isHome = false, hits = [], currentRefinement, refine }) => {
    const [value, setValue] = React.useState<string>('');

    React.useEffect(() => {
        const handleKeyUp: any = (event: React.KeyboardEvent): void => {
            if (event.key === 'Escape') {
                setValue('');
            }
        };

        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const onChange = (event: React.KeyboardEvent, { newValue }: any): void => setValue(newValue);

    const onSuggestionsFetchRequested = ({ value: newValue }: any): void => refine(newValue);

    const onSuggestionsClearRequested = (): void => refine('');

    // tslint:disable-next-line: no-empty
    const onSuggestionHighlighted = (): void => {};

    // tslint:disable-next-line: no-empty
    const onSuggestionSelected = (event: React.MouseEvent, { suggestion }: any): void => {};

    const getSuggestionValue = (hit: IHit): string => hit.textContent;

    const renderSuggestion = (hit: IHit): React.ReactNode => {
        let attributeToSnippet = 'description';

        const description: string = hit._snippetResult.description.matchLevel;
        const textContent: string = hit._snippetResult.textContent.matchLevel;

        if (SNIPPET_MATCH_LEVELS[textContent] > SNIPPET_MATCH_LEVELS[description]) {
            attributeToSnippet = 'textContent';
        }

        return (
            <Link to={hit.url}>
                <Highlight attribute="title" hit={hit} nonHighlightedTagName="h6" />
                <Snippet attribute={attributeToSnippet} hit={hit} nonHighlightedTagName="p" tagName="span" />
            </Link>
        );
    };

    const renderSectionTitle = (section: any): React.ReactNode => {
        const { tools, guides } = searchIndices;
        const coreConcepts = searchIndices['core-concepts'];

        const titles: { [key: string]: string } = {
            [coreConcepts]: 'Core concepts',
            [tools]: 'Tools',
            [guides]: 'Guides',
        };

        if (section.hits.length) {
            return <p>{titles[section.index]}</p>;
        }
        return null;
    };

    const getSectionSuggestions = (section: any): string => section.hits;

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
            {currentRefinement && (
                <AutocompleteOverlay onClick={onSuggestionsClearRequested} shouldLockScroll={!isHome} />
            )}
        </>
    );
};

export const AutoComplete = connectAutoComplete(CustomAutoComplete);
