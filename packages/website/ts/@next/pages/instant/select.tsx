import * as React from 'react';
import styled from 'styled-components';

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
    onChange?: (ev: React.ChangeEvent<HTMLSelectElement>) => void;
    includeEmpty: boolean;
}

export const Select: React.FunctionComponent<SelectProps> = ({
    value,
    id,
    items,
    includeEmpty,
    emptyText,
    onChange,
}) => {
    return (
        <Container>
            <StyledSelect id={id} onChange={onChange}>
                {includeEmpty && <option value="">{emptyText}</option>}
                {items.map((item, index) => (
                    <option
                        key={`${id}-item-${index}`}
                        value={item.value}
                        selected={item.value === value}
                        onClick={item.onClick}
                    >
                        {item.label}
                    </option>
                ))}
            </StyledSelect>
            <Caret width="12" height="7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 1L6 6 1 1" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </Caret>
        </Container>
    );
};

Select.defaultProps = {
    emptyText: 'Select...',
    includeEmpty: true,
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

const Caret = styled.svg`
    position: absolute;
    right: 20px;
    top: calc(50% - 4px);
`;
