import * as React from 'react';
import styled from 'styled-components';
import { media, colors } from '../variables';

import { Alpha, Lead } from './Typography';
import Container from './Container';
import Code from './Code';

const Main = styled.div`
    background-color: ${colors.lightGray};
    padding: 6.25rem;
    display: flex;
    justify-content: space-between;

    ${media.small`
        padding: 2.5rem 1.875rem
        display: block;     
    `};
`;

const Title = styled(Alpha)`
    margin-bottom: 2.5rem;

    ${media.small`margin-bottom: 2.25rem;`};
`;

const Content = styled.div`
    max-width: 25.9375rem;
    display: flex;
    flex-direction: column;

    ${media.small`margin-bottom: 2.25rem;`};
`;

interface IntroProps {
    title: string;
    children: React.ReactNode;
}

function Intro(props: IntroProps) {
    return (
        <Container wide>
            <Main>
                <Content>
                    <Title>{props.title}</Title>
                    <Lead as="div">{props.children}</Lead>
                </Content>
                <Breakout>
                    <Code>Function execute transaction Function execute transaction Function execute transaction</Code>
                </Breakout>
            </Main>
        </Container>
    );
}

export default Intro;
