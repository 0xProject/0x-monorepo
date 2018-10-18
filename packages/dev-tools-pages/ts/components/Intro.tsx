import * as React from 'react';
import styled from 'styled-components';

import { Alpha, Beta } from './Typography';

const Main = styled.div`
    background-color: #f1f4f5;
    padding: 6.25rem;
    display: flex;
    justify-content: space-between;
`;

const Title = styled(Alpha)`
    margin-bottom: 2.5rem;
`;

const Content = styled.div`
    max-width: 25.9375rem;

    display: flex;
    flex-direction: column;
`;

const Code = styled.div`
    background-color: #e9eced;
    width: 520px;
    height: 350px;
`;

interface IntroProps {
    title: string;
    children: React.ReactNode;
}

function Intro(props: IntroProps) {
    return (
        <Main>
            <Content>
                <Title>{props.title}</Title>
                <Beta as="div">{props.children}</Beta>
            </Content>
            <Code />
        </Main>
    );
}

export default Intro;
