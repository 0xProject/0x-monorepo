import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import {Column, Section, Wrap, WrapCentered} from 'ts/@next/components/layout';
import {Heading, Paragraph} from 'ts/@next/components/text';

export interface SelectItemConfig {
    label: string;
    value?: string;
    onClick?: () => void;
}

interface SelectProps {
    value?: string;
    id: string;
    items: SelectItemConfig[];
    emptyText?: string;
}

export const Select: React.FunctionComponent<SelectProps> = ({ value, id, items, emptyText }) => {
    return (
        <Container>
            <StyledSelect id={id}>
                <option value="">{emptyText}</option>
                {items.map((item, index) => <option key={`${id}-item-${index}`} value={item.value} selected={item.value === value} onClick={item.onClick}>{item.label}</option>)}
            </StyledSelect>
            <Caret width="12" height="7" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 1L6 6 1 1" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></Caret>
        </Container>
    );
};

Select.defaultProps = {
    emptyText: 'Select...',
};

const Container = styled.div`
    background-color: #fff;
    border-radius: 4px;
    display: flex;
    width: 100%;
    position: relative;
`;

const StyledSelect = styled.select`
    appearance: none;
    border: 0;
    font-size: 1rem;
    width: 100%;
    padding: 20px 20px 20px 20px;
`;

const SelectAllButton = styled.button`
    appearance: none;
    border: 0;
    font-size: 0.777777778rem;
    display: block;
    opacity: 0.75;
`;

const Caret = styled.svg`
    position: absolute;
    right: 20px;
    top: calc(50% - 4px);
`;
