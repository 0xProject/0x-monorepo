import React from 'react';

import _ from 'lodash';

import { FiltersGroup } from 'ts/components/docs/sidebar/filters_group';

import { styled } from 'ts/style/theme';

interface IFiltersProps {
    filters: IFiltersGroupProps[];
}
interface IFiltersGroupProps {
    attribute: string;
    heading: string;
    customLabel?: string;
}

const transformItems = (items: IFiltersGroupProps[]) => _.orderBy(items, 'label', 'asc');

export const Filters: React.FC<IFiltersProps> = ({ filters }) => (
    <FiltersWrapper>
        {filters.map((filter: IFiltersGroupProps, index: number) => (
            <FiltersGroup key={`filter-${index}`} transformItems={transformItems} {...filter} />
        ))}
    </FiltersWrapper>
);

const FiltersWrapper = styled.aside`
    position: relative;
    max-width: 700px;
`;
