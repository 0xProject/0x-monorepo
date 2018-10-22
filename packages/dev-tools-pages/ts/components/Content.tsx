import * as React from 'react';
import styled from 'styled-components';

import { Beta } from './Typography';
import Container from './Container';
import ContentBlock from './ContentBlock';

const StyledMain =
    styled.div <
    MainProps >
    `
    padding-top: 6.25rem;
    padding-bottom: 6.25rem;
    ${props =>
        props.dark
            ? `
        background-color: #000;
        color: #fff;
    `
            : ''};
`;

interface MainProps {
    dark?: boolean;
    children: React.ReactNode;
}

function Main(props: MainProps) {
    return (
        <StyledMain dark={props.dark}>
            <Container>{props.children}</Container>
        </StyledMain>
    );
}

export default Main;
