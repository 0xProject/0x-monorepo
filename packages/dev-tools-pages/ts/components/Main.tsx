import * as React from 'react';
import styled from 'styled-components';

import { withContext, Props } from './withContext';

import { Alpha } from './Typography';

const StyledMain = styled.div`
    padding-top: 6.25rem;
    padding-bottom: 6.25rem;
`;

const Title = styled(Alpha)`
    color: ${props => props.color};
    margin-bottom: 6.25rem;
`;

interface MainProps extends Props {
    children: React.ReactNode;
}

function Main(props: MainProps) {
    return (
        <StyledMain>
            <Title as="h2" color={props.colors.main}>
                Get started
            </Title>
            {props.children}
        </StyledMain>
    );
}

export default withContext(Main);
