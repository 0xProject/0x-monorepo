import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { ContextInterface } from 'ts/context';
import { media } from 'ts/variables';

import { Alpha, Beta } from './typography';

const Base = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    :not(:last-of-type) {
        margin-bottom: 6.25rem;
    }
    ${Beta} {
        margin-bottom: 2.5rem;
    }
    ${media.small`
        display: block;
        :not(:last-of-type) {
            margin-bottom: 3.125rem;
        }
    `};
`;

const Content = styled.div`
    width: 66.693548387%;
    ${media.small`
        width: 100%;
    `};
`;

const Item = styled.div`
    p {
        max-width: 31.25rem;
    }

    &:not(:last-of-type) {
        margin-bottom: 2.5rem;
        ${media.small`
            margin-bottom: 1.875rem;
        `};
    }
`;

const StyledTitle = styled(Alpha)`
    color: ${props => props.color};
    ${media.small`
        & + div {
            margin-top: 1.5rem;
        }
    `};
`;

interface ContentBlockProps extends ContextInterface {
    title: string;
    main?: boolean;
    children?: React.ReactNode;
}

const ContentBlock: React.StatelessComponent<ContentBlockProps> = props => {
    const children = React.Children.map(props.children, child => {
        return <Item>{child}</Item>;
    });

    const Title = props.main ? StyledTitle : Beta;

    return (
        <Base>
            <Title color={props.colors}>{props.title}</Title>
            {children === undefined ? null : <Content>{children}</Content>}
        </Base>
    );
};

export { ContentBlock };
