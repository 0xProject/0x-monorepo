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
    shouldIncludeEmpty: boolean;
}

export const Select: React.FunctionComponent<SelectProps> = ({
    value,
    id,
    items,
    shouldIncludeEmpty,
    emptyText,
    onChange,
}) => {
    return (
        <Container>
            <StyledSelect id={id} onChange={onChange} defaultValue={value}>
                {shouldIncludeEmpty && <option value="">{emptyText}</option>}
                {items.map((item, index) => (
                    <option
                        key={`${id}-item-${index}`}
                        value={item.value}
                        onClick={item.onClick}
                    >
                        {item.label}
                    </option>
                ))}
            </StyledSelect>
            <Caret width="12" height="7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 1L6 6 1 1" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Caret>
        </Container>
    );
};

Select.defaultProps = {
    emptyText: 'Select...',
    shouldIncludeEmpty: true,
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
