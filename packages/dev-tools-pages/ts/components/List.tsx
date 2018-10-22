import * as React from 'react';
import styled from 'styled-components';
import { media } from '../variables';

const StyledList = styled.ul`
    list-style-type: none;
    margin: 0;
    padding-inline-start: 0.2rem;
`;

const StyledItem = styled.li`
    :before {
        content: '';
        border: 1px solid black;
        width: 0.6875rem;
        height: 0.6875rem;
        display: inline-block;
        transform: rotate(45deg);
        margin-right: 1.09375rem;
    }
    :not(:last-child) {
        margin-bottom: 0.5625rem;

        ${media.small`margin-bottom: 0.375rem`};
    }
`;

interface ListProps {
    items: Array<string>;
}

function List(props: ListProps) {
    const items = props.items;
    const listItems = items.map((bullet, index) => <StyledItem key={index}>{bullet}</StyledItem>);

    return <StyledList>{listItems}</StyledList>;
}

export default List;
