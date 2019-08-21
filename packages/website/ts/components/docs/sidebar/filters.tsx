import * as React from 'react';

import { FiltersClear } from 'ts/components/docs/sidebar/filters_clear';
import { FiltersGroup } from 'ts/components/docs/sidebar/filters_group';
import { SidebarWrapper } from 'ts/components/docs/sidebar/sidebar_wrapper';

interface IFiltersProps {
    filters: IFiltersGroupProps[];
}
interface IFiltersGroupProps {
    attribute: string;
    heading: string;
    hiddenLabels?: string[];
    customLabels?: ICustomLabels;
}

interface ICustomLabels {
    [key: string]: string;
}

export const Filters: React.FC<IFiltersProps> = ({ filters }) => {
    return (
        <SidebarWrapper>
            {filters.map((filter: IFiltersGroupProps, index: number) => (
                <FiltersGroup key={`filter-${index}`} operator="and" {...filter} />
            ))}
            <FiltersClear />
        </SidebarWrapper>
    );
};
