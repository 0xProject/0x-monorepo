import * as React from 'react';
import styled from 'styled-components';

interface ListItemProps {
    children: string;
}

interface OrderedListProps {
    marginBottom?: string;
}
interface UnorderedListProps {
    marginBottom?: string;
}

export const UnorderedList = styled.ul<UnorderedListProps>`
    list-style-type: disc;
    padding-left: 20px;
    margin-bottom: ${props => props.marginBottom};
`;

export const OrderedList = styled.ol<OrderedListProps>`
    list-style-type: decimal;
    padding-left: 20px;
    margin-bottom: ${props => props.marginBottom};
`;

const Li = styled.li`
    padding: 0 0 0.8rem 0.2rem;
    position: relative;
    line-height: 1.4rem;
    text-align: left;
    font-weight: 300;
    opacity: 0.5;
    @media (max-width: 768px) {
        font-size: 15px;
    }
`;

export const ListItem = (props: ListItemProps) => <Li>{props.children}</Li>;
