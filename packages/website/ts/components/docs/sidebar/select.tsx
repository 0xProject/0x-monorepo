import * as React from 'react';
import styled from 'styled-components';
import { colors } from 'ts/style/colors';
import { docs } from 'ts/style/docs';

export interface ISelectItemConfig {
    label: string;
    value?: string;
    onClick?: () => void;
}

interface SelectProps {
    value?: string;
    id: string;
    items: ISelectItemConfig[];
    emptyText?: string;
    onChange?: (ev: React.ChangeEvent<HTMLSelectElement>) => void;
    shouldIncludeEmpty?: boolean;
}

export const Select: React.FunctionComponent<SelectProps> = ({
    value,
    id,
    items,
    shouldIncludeEmpty = true,
    emptyText = 'Select...',
    onChange,
}) => {
    return (
        <Container>
            <StyledSelect id={id} onChange={onChange} defaultValue={value}>
                {shouldIncludeEmpty && <option value="">{emptyText}</option>}
                {items.map((item, index) => (
                    <option key={`${id}-item-${index}`} value={item.value} onClick={item.onClick}>
                        {item.label ? item.label : item.value}
                    </option>
                ))}
            </StyledSelect>
            <svg width="12" height="8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 7l5-5 5 5" stroke={colors.brandDark} strokeWidth="1.5" />
            </svg>
        </Container>
    );
};

const Container = styled.div`
    border: 1px solid ${colors.brandDark};
    border-radius: 4px;
    display: inline-block;
    margin-bottom: ${docs.marginBottom};
    position: relative;

    svg {
        pointer-events: none;
        position: absolute;
        right: 8px;
        top: 50%;
        transform: rotate(180deg) translateY(50%);
    }
`;

const StyledSelect = styled.select`
    appearance: none;
    background-color: #fff;
    border: none;
    cursor: pointer;
    outline: none;
    color: ${colors.brandDark};
    font-family: 'Formular', monospace;
    font-feature-settings: 'tnum';
    font-size: 15px;
    line-height: 17px;
    padding: 4px 26px 4px 12px;
    width: 100%;
`;
