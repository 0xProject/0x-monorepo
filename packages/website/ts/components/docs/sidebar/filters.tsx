import React from 'react';

import _ from 'lodash';

import { FiltersGroup } from 'ts/components/docs/sidebar/filters_group';
import { SidebarWrapper } from 'ts/components/docs/sidebar/sidebar_wrapper';

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
    <SidebarWrapper>
        {filters.map((filter: IFiltersGroupProps, index: number) => (
            <FiltersGroup key={`filter-${index}`} transformItems={transformItems} {...filter} />
        ))}
    </SidebarWrapper>
);
