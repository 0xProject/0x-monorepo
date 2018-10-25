import * as React from 'react';
import styled from 'styled-components';
import { media, colors } from '../variables';

import { Alpha, Lead } from './Typography';
import Container from './Container';
import Breakout from './Breakout';

const Main = styled.div`
    background-color: ${colors.lightGray};
    padding: 6.25rem;
    display: flex;
    justify-content: space-between;

    ${media.medium`
        padding: 2.5rem 1.875rem
        display: block;     
    `};
`;

const Title = styled(Alpha)`
    margin-bottom: 2.5rem;

    ${media.small`margin-bottom: 2.25rem;`};
`;

const StyledIntroLead = styled(Lead)`
    max-width: 25.9375rem;
    ${media.small`margin-bottom: 1.5625rem;`};
`;

const StyledIntroAside = styled.div`
    max-width: 32.5rem;
    position: relative;
`;

interface IntroProps {
    children?: React.ReactNode;
}

interface IntroLeadProps {
    title: string;
    children?: React.ReactNode;
}

function IntroLead(props: IntroLeadProps) {
    return (
        <StyledIntroLead as="div">
            <Title>{props.title}</Title>
            {props.children}
        </StyledIntroLead>
    );
}

function IntroAside(props: IntroProps) {
    return (
        <Breakout>
            <StyledIntroAside>{props.children}</StyledIntroAside>
        </Breakout>
    );
}

function Intro(props: IntroProps) {
    return (
        <Container wide>
            <Main>{props.children}</Main>
        </Container>
    );
}

export default Intro;
export { IntroLead, IntroAside, Intro };
