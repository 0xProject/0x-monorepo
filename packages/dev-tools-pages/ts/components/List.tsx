import * as React from 'react';
import styled from 'styled-components';
import { media } from '../variables';

const StyledList = styled.ul`
    list-style-type: none;
    margin: 0;
    padding-inline-start: 0rem;
    position: relative;
`;

const StyledItem = styled.li`
    position: relative;
    padding-left: 26px;  

    :before {
        content: '';
        position: absolute;
        left: 0;
        border: 1px solid black;
        width: 0.6875rem;
        height: 0.6875rem;
        display: inline-block;
        transform: rotate(45deg) translateY(-50%);
        top: 12px;
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
