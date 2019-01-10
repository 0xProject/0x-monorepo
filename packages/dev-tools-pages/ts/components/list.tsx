import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { media } from 'ts/variables';

const StyledList = styled.ul`
    list-style-type: none;
    margin: 0;
    padding: 0;
    position: relative;
`;

const StyledItem = styled.li`
    position: relative;
    padding-left: 1.625rem;

    :before {
        content: '';
        border: 1px solid black;
        width: 0.625rem;
        height: 0.625rem;
        display: inline-block;
        position: absolute;
        margin-top: 2px;
        top: 0.3125rem;
        left: 0;
        transform: rotate(45deg);
    }
    :not(:last-child) {
        margin-bottom: 0.5625rem;
        ${media.small`
            margin-bottom: 0.375rem;
        `};
    }
`;

interface ListProps {
    items?: [];
}

const List: React.StatelessComponent<ListProps> = props => (
    <StyledList>
        {props.children !== undefined
            ? props.children
            : _.map(props.items, (bullet, index) => <StyledItem key={index}>{bullet}</StyledItem>)}
    </StyledList>
);

export { List, StyledItem as ListItem };
