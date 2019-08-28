import * as _ from 'lodash';
import * as React from 'react';
import { connectRefinementList } from 'react-instantsearch-dom';

import { Filter, IFilterProps } from 'ts/components/docs/sidebar/filter';
import { Heading } from 'ts/components/text';

import { styled } from 'ts/style/theme';
import { difficultyOrder } from 'ts/utils/algolia_constants';

interface IFilterListProps {
    attribute: string;
    currentRefinement: string[];
    customLabels?: ICustomLabels;
    heading: string;
    hiddenLabels?: string[];
    isDisabled?: boolean;
    items: IFilterProps[];
    operator: string;
    refine: (value: string) => void;
    transformItems: (items: IFilterProps[]) => void;
}

interface ICustomLabels {
    [key: string]: string;
}

const FiltersList: React.FC<IFilterListProps> = ({
    attribute,
    items,
    currentRefinement,
    customLabels,
    heading,
    hiddenLabels,
    refine,
}) => {
    const [filters, setFilters] = React.useState<IFilterProps[]>([]);
    //    Note (Piotr): Whenever you choose a filter (refinement), algolia removes all filters that could not match the query.
    //    What we are doing instead is first grabbing the list of all possible filters on mount (or clearing all filters) and
    //    then visually disabling filters. That way the user is still able to see all filters, even those that do not apply to
    //    the current state of filtering.

    const sortAlphabetically = (_items: IFilterProps[]) => _.orderBy(_items, 'label', 'asc');

    const sortByDifficulty = (_items: IFilterProps[]) => {
        return _items.sort((a, b) => difficultyOrder.indexOf(a.label) - difficultyOrder.indexOf(b.label));
    };

    const sortFilters = (_items: IFilterProps[]) =>
        attribute === 'difficulty' ? sortByDifficulty(_items) : sortAlphabetically(_items);

    React.useEffect(() => {
        // This happens on mount when filters are empty or on clearing all filters, when the items number exceeds that of filters
        if (!filters.length || items.length >= filters.length) {
            setFilters(items);
        } else {
            const updatedFilters = [...filters];

            for (const filter of updatedFilters) {
                // Look for item corresponding to the filter we already have
                const currentItem = items.find(item => item.label === filter.label);
                if (currentItem) {
                    // If there is a matching item and it is in the current refinement, we update our list of filters so that the filter is checked
                    const isRefined = currentRefinement.includes(filter.label);
                    filter.isRefined = isRefined;
                    filter.isDisabled = false;
                } else {
                    // No match found means that algolia does not return the filter and we disable it on the initial list
                    filter.isDisabled = true;
                }
            }

            setFilters(updatedFilters);
        }
    }, [items]);

    if (!filters.length) {
        return null;
    }

    const sortedFilters = sortFilters(filters);

    return (
        <FiltersGroupWrapper>
            <Heading asElement="h3" size={18} fontWeight="400" marginBottom="1rem">
                {heading}
            </Heading>
            {sortedFilters.map((filter: IFilterProps, index: number) => {
                if (hiddenLabels && hiddenLabels.includes(filter.label)) {
                    return null;
                }
                return (
                    <Filter
                        key={`filter-${index}`}
                        currentRefinement={currentRefinement}
                        customLabels={customLabels}
                        refine={refine}
                        {...filter}
                    />
                );
            })}
        </FiltersGroupWrapper>
    );
};

export const FiltersGroup = connectRefinementList(FiltersList);

const FiltersGroupWrapper = styled.div`
    margin-bottom: 2.22em;

    @media (max-width: 900px) {
        margin-bottom: 30px;
    }
`;
