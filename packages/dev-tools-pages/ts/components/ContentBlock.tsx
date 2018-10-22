import * as React from 'react';
import styled from 'styled-components';

import { withContext, Props } from './withContext';
import { Beta, Alpha } from './Typography';

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

const StyledTitle = styled(Alpha)`
    color: ${props => props.color};
`;

interface ContentBlockProps extends Props {
    title: string;
    main?: boolean;
    children?: React.ReactNode;
}

function ContentBlock(props: ContentBlockProps) {
    const children = React.Children.map(props.children, child => {
        return <Item>{child}</Item>;
    });

    const Title = props.main ? StyledTitle : Beta;

    return (
        <Base>
            <Title color={props.colors.main}>{props.title}</Title>
            {children ? <Content>{children}</Content> : null}
        </Base>
    );
}

export default withContext(ContentBlock);
