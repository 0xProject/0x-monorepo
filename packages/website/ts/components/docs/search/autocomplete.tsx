import * as React from 'react';
import Autosuggest from 'react-autosuggest';
import { connectAutoComplete, Highlight, Snippet } from 'react-instantsearch-dom';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { scroller } from 'react-scroll';

import { Link } from 'ts/components/documentation/shared/link';

import { AutocompleteOverlay } from 'ts/components/docs/search/autocomplete_overlay';
import { AutocompleteWrapper } from 'ts/components/docs/search/autocomplete_wrapper';

import { docs } from 'ts/style/docs';
import { searchIndices } from 'ts/utils/algolia_search';

interface IHit {
    description: string;
    difficulty: string;
    id: number | string;
    isCommunity?: boolean;
    isFeatured?: boolean;
    objectID: string;
    sectionUrl: string;
    tags?: string[];
    textContent: string;
    title: string;
    type?: string;
    url: string;
    _highlightResult: any;
    _snippetResult: any;
}

interface IAutoCompleteProps extends RouteComponentProps<{}> {
    isHome?: boolean;
    hits?: object[];
    currentRefinement?: string;
    refine?: (value: string) => void;
}

interface ISnippetMatchLevels {
    [index: string]: number;
}

const SNIPPET_MATCH_LEVELS: ISnippetMatchLevels = { none: 0, partial: 1, full: 2 };

const CustomAutoComplete: React.FC<IAutoCompleteProps> = ({
    isHome = false,
    hits = [],
    currentRefinement,
    refine,
    history,
    location,
}) => {
    const [value, setValue] = React.useState<string>('');
    let inputRef: HTMLInputElement;

    React.useEffect(() => {
        const handleKeyUp: any = (event: React.KeyboardEvent): void => {
            if (event.key === 'Escape') {
                setValue('');
                inputRef.blur();
            }
        };

        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const onSuggestionsFetchRequested = ({ value: newValue }: any): void => refine(newValue);

    const onSuggestionsClearRequested = (): void => refine('');

    const onSuggestionSelected = (event: React.KeyboardEvent, { suggestion }: any): void => {
        const [pathname, fragment] = suggestion.url.split('#');
        // If the url contains a hash (fragment identifier) and the user is currently
        // on the same page, scroll to content. If not, route away to the doc page.
        if (fragment && location.pathname === pathname) {
            scroller.scrollTo(fragment, {
                smooth: true,
                duration: docs.scrollDuration,
                offset: -docs.headerOffset,
            });
        } else {
            history.push(suggestion.url);
            window.scrollTo(0, 0);
        }

        setValue(''); // Clear input value
        inputRef.blur(); // Blur input
    };

    const getSuggestionValue = (hit: IHit): string => hit.textContent;

    const renderSuggestion = (hit: IHit): React.ReactNode => {
        const description: string = hit._snippetResult.description.matchLevel;
        const textContent: string = hit._snippetResult.textContent.matchLevel;

        let attributeToSnippet = 'description';

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

    const storeInputRef = (autosuggest: any): void => {
        if (autosuggest !== null) {
            inputRef = autosuggest.input;
        }
    };

    const onChange = (event: React.KeyboardEvent, { newValue, method }: any): void => {
        // Only set value if the user typed it in, without it it leads to populating the input with snippet or highlight text
        if (method === 'type') {
            setValue(newValue);
        }
    };

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
                    ref={storeInputRef}
                    multiSection={true}
                    focusInputOnSuggestionClick={false}
                    onSuggestionSelected={onSuggestionSelected}
                    onSuggestionsFetchRequested={onSuggestionsFetchRequested}
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

export const AutoComplete = connectAutoComplete(withRouter(CustomAutoComplete));
