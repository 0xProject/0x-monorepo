import React from 'react';

import { Filter } from 'ts/components/docs/sidebar/filter';
import { Heading } from 'ts/components/text';

import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';

export interface IFiltersProps {
    groups: FilterGroup[];
}

export interface FilterGroup {
    heading: string;
    name: string;
    filters: IFilterProps[];
}

interface IFilterProps {
    value: string;
    label: string;
}

export const Filters: React.FC<IFiltersProps> = ({ groups }) => {
    return (
        <FiltersWrapper>
            {groups.map(({ heading, name, filters }: FilterGroup, groupIndex) => (
                <FiltersGroupWrapper key={`filter-group-${groupIndex}`}>
                    <FilterGroupHeading asElement="h3">{heading}</FilterGroupHeading>
                    {filters.map(({ value, label }: IFilterProps, filterIndex) => (
                        <Filter key={`filter-${name}-${filterIndex}`} name={name} value={value} label={label} />
                    ))}
                </FiltersGroupWrapper>
            ))}
        </FiltersWrapper>
    );
};

const FiltersWrapper = styled.div`
    position: relative;
    max-width: 702px;
`;

const FiltersGroupWrapper = styled.div`
    margin-bottom: 2.22em;
`;

const FilterGroupHeading = styled(Heading)`
    color: ${colors.textDarkPrimary};
    font-size: 1rem !important;
    font-weight: 400 !important;
    margin-bottom: 1em !important;
`;
