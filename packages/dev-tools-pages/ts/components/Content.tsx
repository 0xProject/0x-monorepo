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
    title?: string;
    subtitle?: string;
    dark?: boolean;
    children: React.ReactNode;
}

function Main(props: MainProps) {
    return (
        <StyledMain dark={props.dark}>
            <Container>
                <ContentBlock main title={props.title || 'Get started'}>
                    {props.subtitle ? <Beta as="p">{props.subtitle}</Beta> : null}
                </ContentBlock>

                {props.children}
            </Container>
        </StyledMain>
    );
}

export default Main;
