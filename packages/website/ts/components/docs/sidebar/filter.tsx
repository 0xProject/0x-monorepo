import * as React from 'react';
import styled from 'styled-components';
import { colors } from 'ts/style/colors';

export interface FilterProps {
    name: string;
    value: string;
    label: string;
}

export const Filter: React.FunctionComponent<FilterProps> = ({ value, name, label }: FilterProps) => (
    <Wrapper>
        <Checkbox name={name} />
        <CheckboxBox />
        <Label>{label}</Label>
    </Wrapper>
);

const Wrapper = styled.label`
    cursor: pointer;
    display: flex;
    align-items: center;
    margin-bottom: 0.833333333rem;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
    position: absolute;
    opacity: 0;
    opacity: 0;
`;

const CheckboxBox = styled.div`
    border: 1px solid #cbcbcb;
    width: 22px;
    height: 22px;
    margin-right: 0.666rem;

    ${Checkbox}:checked ~ & {
        background: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.983 12.522c-.21 0-.4-.07-.557-.226l-3.46-3.461a.777.777 0 0 1 0-1.113.777.777 0 0 1 1.112 0L6 10.626l6.94-6.922a.777.777 0 0 1 1.112 0c.313.313.313.8 0 1.113l-7.495 7.479a.83.83 0 0 1-.574.226z' fill='currentColor'/%3E%3C/svg%3E")
            no-repeat center;
    }
`;

const Label = styled.span`
    font-size: 0.833rem;
    color: ${colors.textDarkPrimary};
    font-weight: 300;
`;
