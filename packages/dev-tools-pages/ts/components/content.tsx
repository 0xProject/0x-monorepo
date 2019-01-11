import * as React from 'react';
import styled from 'styled-components';

import { Container } from './container';

const StyledMain = styled.div<MainProps>`
    padding-top: 6.25rem;
    padding-bottom: 6.25rem;
    ${props =>
        props.dark
            ? `
        background-color: #000;
        color: #fff;
        p:not([class]) {
            color: #CCC;
        }
    `
            : ''};
`;

interface MainProps {
    dark?: boolean;
}

const Content: React.StatelessComponent<MainProps> = props => (
    <StyledMain dark={props.dark}>
        <Container>{props.children}</Container>
    </StyledMain>
);

export { Content };
