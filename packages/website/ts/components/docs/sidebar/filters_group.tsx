import * as React from 'react';
import { connectRefinementList } from 'react-instantsearch-dom';

import { Filter, IFilterProps } from 'ts/components/docs/sidebar/filter';
import { Heading } from 'ts/components/text';

import { styled } from 'ts/style/theme';

interface IFilterListProps {
    heading: string;
    currentRefinement: string[];
    customLabel?: string;
    isDisabled?: boolean;
    items: IFilterProps[];
    operator: string;
    refine: (value: string) => void;
    transformItems: (items: IFilterProps[]) => void;
}

const FiltersList: React.FC<IFilterListProps> = ({ items, currentRefinement, customLabel, heading, refine }) => {
    const [filters, setFilters] = React.useState<IFilterProps[]>([]);
    //    Note (Piotr): Whenever you choose a filter (refinement), algolia removes all filters that could not match the query.
    //    What we are doing instead is first grabbing the list of all possible filters on mount (or clearing all filters) and
    //    then visually disabling filters. That way the user is still able to see all filters, even those that do not apply to
    //    the current state of filtering.

    React.useEffect(
        () => {
            // This happens on mount when filters are empty or on clearing all filters, when the items number exceeds that of filters
            if (!filters.length || items.length >= filters.length) {
                setFilters(items);
            } else {
                const updatedFilters = [...filters];
                for (const filter of updatedFilters) {
                    // Look for item corresponding to the filter we already have
                    const currentItem = items.find(item => item.label === filter.label);
                    // No match found means that algolia does not return the filter and we disable it on the initial list
                    if (!currentItem) {
                        filter.isDisabled = true;
                    }
                    // If there is a matching item and it is in the current refinement, we update our list of filters so that the filter is checked
                    if (currentItem) {
                        const isRefined = currentRefinement.includes(filter.label);
                        filter.isRefined = isRefined;
                    }
                }
                setFilters(updatedFilters);
            }
        },
        [items],
    );

    if (!filters.length) {
        return null;
    }

    return (
        <FiltersGroupWrapper>
            <Heading asElement="h3" size={18} fontWeight="400" marginBottom="1rem">
                {heading}
            </Heading>
            {filters.map((filter: IFilterProps, index: number) => (
                <Filter
                    key={`filter-${index}`}
                    currentRefinement={currentRefinement}
                    customLabel={customLabel}
                    refine={refine}
                    {...filter}
                />
            ))}
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
