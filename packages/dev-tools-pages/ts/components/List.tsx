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
    items?: Array<string>;
    children?: React.ReactNode;
}

function List(props: ListProps) {
    return (
        <StyledList>
            {props.children !== undefined
                ? props.children
                : props.items.map((bullet, index) => <StyledItem key={index}>{bullet}</StyledItem>)}
        </StyledList>
    );
}

export default List;
export { List, StyledItem as ListItem };
