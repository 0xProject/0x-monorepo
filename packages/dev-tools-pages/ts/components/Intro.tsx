import * as React from 'react';
import styled from 'styled-components';
import { media, colors } from '../variables';

import { Alpha, Lead } from './Typography';
import Container from './Container';

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

const Inner = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

const Title = styled(Alpha)`
    margin-bottom: 2.5rem;

    ${media.small`margin-bottom: 2.25rem;`};
`;

const Blocks = styled.div`
    display: flex;
    justify-content: space-between;

    ${media.small`display: block;`};
`;

const IntroLead = styled(Lead)`
    max-width: 25.9375rem;

    ${media.small`margin-bottom: 1.5625rem;`};
`;
const IntroAside = styled.div`
    max-width: 32.5rem;
    position: relative; 

    ${media.small`
        margin-left: -30px;
        width: calc(100% + 60px);
    `};
`;

interface IntroProps {
    title: string;
    children?: React.ReactNode;
}

function Intro(props: IntroProps) {
    return (
        <Container wide>
            <Main>
                <Inner>
                    <Title>{props.title}</Title>
                    <Blocks>{props.children}</Blocks>
                </Inner>
            </Main>
        </Container>
    );
}

export default Intro;
export { IntroLead, IntroAside, Intro };
