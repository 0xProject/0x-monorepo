import React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

export interface IFilterProps extends IFilterCheckboxProps {
    label: string;
    customLabel?: string;
    value: string;
    refine: (value: string) => void;
}

interface IFilterCheckboxProps {
    isRefined: boolean;
}

export const Filter: React.FC<IFilterProps> = ({ isRefined, label, value, customLabel, refine }) => {
    const handleClick = () => refine(value);

    return (
        <FilterWrapper onClick={handleClick}>
            <FilterCheckbox isRefined={isRefined} />
            <FilterLabel>{customLabel ? customLabel : label}</FilterLabel>
        </FilterWrapper>
    );
};

const FilterWrapper = styled.label`
    cursor: pointer;
    display: flex;
    align-items: center;
    margin-bottom: 0.83rem;
`;

const FilterCheckbox = styled.div<{ isRefined: boolean }>`
    border: 1px solid #cbcbcb;
    width: 22px;
    height: 22px;
    margin-right: 0.67rem;

    ${({ isRefined }) =>
        isRefined &&
        `background: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.983 12.522c-.21 0-.4-.07-.557-.226l-3.46-3.461a.777.777 0 0 1 0-1.113.777.777 0 0 1 1.112 0L6 10.626l6.94-6.922a.777.777 0 0 1 1.112 0c.313.313.313.8 0 1.113l-7.495 7.479a.83.83 0 0 1-.574.226z' fill='currentColor'/%3E%3C/svg%3E") no-repeat center;`};
`;

const FilterLabel = styled.span`
    color: ${colors.textDarkPrimary};
    font-size: 0.83rem;
    font-weight: 300;
`;
