import * as React from 'react';
import styled from 'styled-components';

import { Beta } from './Typography';

const Base = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    &:not(:last-of-type) {
        margin-bottom: 6.25rem;
    }
`;

const Content = styled.div`
    width: 66.693548387%;
`;

const Item = styled.div`
    p {
        max-width: 31.25rem;
    }

    &:not(:last-of-type) {
        margin-bottom: 2.5rem;
    }
`;

interface ContentBlockProps {
    title: string;
    children: React.ReactNode;
}

function ContentBlock(props: ContentBlockProps) {
    const children = React.Children.map(props.children, child => {
        return <Item>{child}</Item>;
    });

    return (
        <Base>
            <Beta>{props.title}</Beta>
            <Content>{children}</Content>
        </Base>
    );
}

export default ContentBlock;
