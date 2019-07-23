import React from 'react';

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

export const Filters: React.FC<IFiltersProps> = ({ filters }) => (
    <FiltersWrapper>
        {filters.map((filter: IFiltersGroupProps, index: number) => (
            <FiltersGroup key={`filter-${index}`} {...filter} />
        ))}
    </FiltersWrapper>
);

const FiltersWrapper = styled.aside`
    position: relative;
    max-width: 700px;
`;
