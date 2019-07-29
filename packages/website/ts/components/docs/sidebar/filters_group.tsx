import * as React from 'react';
import { connectRefinementList } from 'react-instantsearch-dom';

import { Filter, IFilterProps } from 'ts/components/docs/sidebar/filter';
import { Heading } from 'ts/components/text';

import { styled } from 'ts/style/theme';

interface IFilterListProps {
    heading: string;
    customLabel?: string;
    items: IFilterProps[];
    refine: (value: string) => void;
    transformItems: (items: IFilterProps[]) => void;
}

const FiltersList: React.FC<IFilterListProps> = ({ items, customLabel, heading, refine }) => {
    if (!items.length) {
        return null;
    }

    return (
        <FiltersGroupWrapper>
            <Heading asElement="h3" size={18} fontWeight="400" marginBottom="1rem">
                {heading}
            </Heading>
            {items.map((item: IFilterProps, index: number) => (
                <Filter key={`filter-${index}`} customLabel={customLabel} refine={refine} {...item} />
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
